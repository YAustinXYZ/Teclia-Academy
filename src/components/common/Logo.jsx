<<<<<<< HEAD
import logo from '../../assets/teclia1_logo1.svg';
=======
import logo from '../../assets/teclia_logo.png';
>>>>>>> 12f235eab4135674569cdc4a5bde0840292d3438

export const Logo = ({ size = 42, showTagline = true }) => (
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
