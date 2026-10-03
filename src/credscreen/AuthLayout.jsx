function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="auth">
      <div className="auth__brand">
        <img src="/192.png" alt="" width="52" height="52" className="auth__logo" />
        <h1 className="auth__title">{title}</h1>
        <p className="auth__sub">{subtitle}</p>
      </div>
      {children}
      {footer && <p className="auth__footer">{footer}</p>}
    </div>
  );
}

export default AuthLayout;
