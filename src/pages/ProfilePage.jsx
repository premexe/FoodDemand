import AuthenticatedSectionLayout from '../components/AuthenticatedSectionLayout';

const restaurantInfo = [
  { label: 'Restaurant Name', value: 'CookIQ Flagship Kitchen' },
  { label: 'Location', value: 'Bengaluru, India' },
  { label: 'Cuisine Type', value: 'North Indian + Multi Cuisine' },
  { label: 'Seating Capacity', value: '120' },
];

const modelSettings = [
  { label: 'Model Version', value: 'DemandNet v4.2' },
  { label: 'Forecast Horizon', value: '1-7 days' },
  { label: 'Retrain Frequency', value: 'Weekly (Auto)' },
  { label: 'Confidence Threshold', value: '0.72' },
];

export default function ProfilePage() {
  return (
    <AuthenticatedSectionLayout
      title="Profile"
      subtitle="User, restaurant, theme, and model configuration in one control workspace."
    >
      {({ activeTheme, cardStyle, user, resolvedTheme, onLogout }) => {
        const verificationLabel = user?.verificationMethod
          ? user.verificationMethod.charAt(0).toUpperCase() + user.verificationMethod.slice(1)
          : 'Unknown';

        const userInfo = [
          { label: 'Full Name', value: user?.name || 'Not available' },
          { label: 'Email', value: user?.email || 'Not available' },
          { label: 'Phone', value: user?.phoneNumber || 'Not available' },
          { label: 'Verification', value: verificationLabel },
          { label: 'Theme', value: resolvedTheme.charAt(0).toUpperCase() + resolvedTheme.slice(1) },
        ];

        return (
          <div className="space-y-6">
            <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="bento-card p-6" style={cardStyle}>
                <div className="badge-neon mb-4 w-fit">Restaurant Info</div>
                <div className="space-y-3">
                  {restaurantInfo.map((item) => (
                    <div key={item.label} className="rounded-2xl p-4" style={cardStyle}>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: activeTheme.muted }}>{item.label}</p>
                      <p className="text-sm font-semibold mt-1">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bento-card p-6" style={cardStyle}>
                <div className="badge-neon mb-4 w-fit">User Info</div>
                <div className="space-y-3">
                  {userInfo.map((item) => (
                    <div key={item.label} className="rounded-2xl p-4" style={cardStyle}>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: activeTheme.muted }}>{item.label}</p>
                      <p className="text-sm font-semibold mt-1 break-all">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="bento-card p-6" style={cardStyle}>
                <div className="badge-neon mb-4 w-fit">Model Settings</div>
                <div className="space-y-3">
                  {modelSettings.map((setting) => (
                    <div key={setting.label} className="rounded-2xl p-4" style={cardStyle}>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: activeTheme.muted }}>{setting.label}</p>
                      <p className="text-sm font-semibold mt-1">{setting.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bento-card p-6" style={cardStyle}>
                <div className="badge-neon mb-4 w-fit">Session Control</div>
                <p className="text-sm font-semibold mb-4" style={{ color: activeTheme.muted }}>
                  Theme toggle is available in the top navigation bar. Use logout when switching users.
                </p>
                <button
                  onClick={onLogout}
                  className="px-7 py-3 rounded-full text-sm font-black uppercase tracking-widest"
                  style={cardStyle}
                >
                  Logout
                </button>
              </div>
            </section>
          </div>
        );
      }}
    </AuthenticatedSectionLayout>
  );
}