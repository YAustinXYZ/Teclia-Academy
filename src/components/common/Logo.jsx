import logo from '../../../Imagenes/teclia_logo.png';

export const Logo = ({ size = 56, showTagline = true }) => (
  <div className="brand logo-brand">
    <img src={logo} alt="Teclia logo" className="brand-logo" width={size} height={size} />
    <div className="brand-text">
      <div className="brand-title-row">
        <p className="brand-name">Teclia</p>
      </div>
      {showTagline && <p className="brand-tag">Piano learning, refined.</p>}
    </div>
  </div>
);
