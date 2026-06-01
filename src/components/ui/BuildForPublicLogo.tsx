import Image from 'next/image';

interface BuildForPublicLogoProps {
  height?: number;
  className?: string;
}

export function BuildForPublicLogo({ height = 28, className }: BuildForPublicLogoProps) {
  const width = Math.round(height * (220 / 56)); // preserve aspect ratio
  return (
    <Image
      src="/build-for-public-logo.png"
      alt="Build for Public"
      width={width}
      height={height}
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', background: '#fff' }}
    />
  );
}
