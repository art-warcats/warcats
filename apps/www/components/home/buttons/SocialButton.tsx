import {ButtonStyled} from './ButtonStyled';

interface Props {
  href: string;
  x: string;
  y: string;
  imageHref: string;
}

export const SocialButton = ({href, x, y, imageHref}: Props) => {
  return (
    <ButtonStyled
      className="w-[1512] h-[152]"
      x={x}
      y={y}
      href={imageHref}
      onClick={() => {
        window.open(href);
      }}
    />
  );
};
