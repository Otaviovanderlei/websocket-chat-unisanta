import logo from "../assets/unisanta-universidade-santa-cecilia.webp";

interface UnisantaLogoProps {
  variant: "sidebar" | "login";
}

export function UnisantaLogo({ variant }: UnisantaLogoProps) {
  return (
    <span className={`unisanta-logo-frame unisanta-logo-frame--${variant}`}>
      <img
        className={`unisanta-logo unisanta-logo--${variant}`}
        src={logo}
        alt="UNISANTA - Universidade Santa Cecília"
        width={1016}
        height={752}
      />
    </span>
  );
}
