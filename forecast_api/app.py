import os
from datetime import date, datetime, timedelta
from typing import Any

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

DEFAULT_MODEL_PATH = r"C:\Users\Admin\Downloads\demand_forecast_model.pkl"
MODEL_PATH = os.getenv("MODEL_PATH", DEFAULT_MODEL_PATH)


class DailyPoint(BaseModel):
    date: str
    demand: float


class DatasetRow(BaseModel):
    date: str | None = None
    itemName: str | None = None
    quantity: float | None = None
    revenue: float | None = None


class ForecastRequest(BaseModel):
    horizonDays: int = 7
    selectedItem: str | None = None
    dailySeries: list[DailyPoint] = []
    rows: list[DatasetRow] = []


class ForecastPoint(BaseModel):
    date: str
    demand: int


class ForecastResponse(BaseModel):
    forecast: list[ForecastPoint]
    source: str
    modelLoaded: bool
    message: str | None = None


app = FastAPI(title="FoodDemand Forecast API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


model = None
feature_names: list[str] = []
menu_feature_names: list[str] = []
menu_values: list[str] = []


def safe_date(value: str | None) -> date | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value[:10]).date()
    except ValueError:
        return None


def load_model() -> tuple[bool, str]:
    global model, feature_names, menu_feature_names, menu_values
    try:
        model = joblib.load(MODEL_PATH)
        names = getattr(model, "feature_names_in_", None)
        feature_names = [str(name) for name in names] if names is not None else []
        menu_feature_names = [name for name in feature_names if name.startswith("menu_item_name_")]
        menu_values = [name.replace("menu_item_name_", "", 1) for name in menu_feature_names]
        return True, f"Model loaded from {MODEL_PATH}"
    except Exception as error:
        model = None
        feature_names = []
        menu_feature_names = []
        menu_values = []
        return False, f"Model load failed: {type(error).__name__}: {error}"


MODEL_READY, MODEL_MESSAGE = load_model()


def history_series(payload: ForecastRequest) -> list[tuple[date, float]]:
    points: list[tuple[date, float]] = []
    if payload.dailySeries:
        for point in payload.dailySeries:
            d = safe_date(point.date)
            if d is None:
                continue
            points.append((d, float(point.demand)))
        points.sort(key=lambda item: item[0])
        if points:
            return points

    totals: dict[date, float] = {}
    for row in payload.rows:
        d = safe_date(row.date)
        if d is None or row.quantity is None:
            continue
        totals[d] = totals.get(d, 0.0) + max(0.0, float(row.quantity))
    return sorted(totals.items(), key=lambda item: item[0])


def fallback_forecast(payload: ForecastRequest) -> list[ForecastPoint]:
    horizon = max(1, min(int(payload.horizonDays or 7), 30))
    series = history_series(payload)
    if not series:
        today = date.today()
        return [
            ForecastPoint(date=(today + timedelta(days=i + 1)).isoformat(), demand=0)
            for i in range(horizon)
        ]

    dates = [entry[0] for entry in series]
    values = [entry[1] for entry in series]
    base_date = dates[-1]
    recent = values[-7:] if len(values) >= 7 else values
    baseline = float(np.mean(recent))

    trend = 0.0
    if len(values) >= 2:
        trend = (values[-1] - values[max(0, len(values) - 7)]) / max(1, len(recent) - 1)

    output: list[ForecastPoint] = []
    for i in range(horizon):
        raw = baseline + trend * (i + 1)
        demand = max(0, int(round(raw)))
        output.append(ForecastPoint(date=(base_date + timedelta(days=i + 1)).isoformat(), demand=demand))
    return output


def estimate_price_from_rows(rows: list[DatasetRow], selected_item: str | None) -> tuple[float, float]:
    unit_prices: list[float] = []
    for row in rows:
        if row.quantity is None or row.revenue is None:
            continue
        qty = float(row.quantity)
        rev = float(row.revenue)
        if qty <= 0 or rev <= 0:
            continue
        if selected_item and row.itemName and row.itemName.strip() != selected_item:
            continue
        unit_prices.append(rev / qty)

    if unit_prices:
        avg_price = float(np.mean(unit_prices))
    else:
        avg_price = 12.0
    return avg_price, avg_price * 0.65


def model_forecast(payload: ForecastRequest) -> list[ForecastPoint] | None:
    if model is None or not feature_names:
        return None

    selected_item = (payload.selectedItem or "").strip()
    if not selected_item:
        return None

    target_feature = f"menu_item_name_{selected_item}"
    if target_feature not in feature_names:
        return None

    series = history_series(payload)
    if not series:
        return None

    horizon = max(1, min(int(payload.horizonDays or 7), 30))
    base_date = series[-1][0]
    selling_price, cost_price = estimate_price_from_rows(payload.rows, selected_item)

    rows: list[dict[str, Any]] = []
    for i in range(horizon):
        current = base_date + timedelta(days=i + 1)
        row: dict[str, Any] = {name: 0.0 for name in feature_names}
        if "is_weekend" in row:
            row["is_weekend"] = 1.0 if current.weekday() >= 5 else 0.0
        if "has_promotion" in row:
            row["has_promotion"] = 0.0
        if "special_event" in row:
            row["special_event"] = 0.0
        if "actual_selling_price" in row:
            row["actual_selling_price"] = float(selling_price)
        if "cost_price" in row:
            row["cost_price"] = float(cost_price)
        row[target_feature] = 1.0
        rows.append(row)

    frame = pd.DataFrame(rows, columns=feature_names)
    predictions = model.predict(frame)

    output: list[ForecastPoint] = []
    for i, value in enumerate(predictions.tolist()):
        output.append(
            ForecastPoint(
                date=(base_date + timedelta(days=i + 1)).isoformat(),
                demand=max(0, int(round(float(value)))),
            )
        )
    return output


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "ok": True,
        "modelLoaded": MODEL_READY and model is not None,
        "modelPath": MODEL_PATH,
        "menuItemsSupported": menu_values,
        "message": MODEL_MESSAGE,
    }


@app.post("/forecast", response_model=ForecastResponse)
@app.post("/predict", response_model=ForecastResponse)
def forecast(payload: ForecastRequest) -> ForecastResponse:
    predicted = model_forecast(payload)
    if predicted is not None:
        return ForecastResponse(
            forecast=predicted,
            source="model",
            modelLoaded=True,
            message="Model-based forecast generated for selected item.",
        )

    return ForecastResponse(
        forecast=fallback_forecast(payload),
        source="fallback",
        modelLoaded=model is not None,
        message="Using fallback trend forecast. Select a supported item name for model inference.",
    )

