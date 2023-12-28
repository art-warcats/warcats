import {ButtonStyled} from './ButtonStyled';

interface Props {
  x: number | string;
  y: number | string;
}

export const BuyButton = ({x, y}: Props) => {
  return (
    <ButtonStyled
      className="w-[1512] h-[152]"
      x={x}
      y={y}
      href="images/mint.svg"
      onClick={() => {
        window.open(
          'https://app.stargaze.zone/launchpad/stars1z4gdx0vgsks4cz62tvergz5mpafp0jsn6cufsa7amymh9dengppsrkl9yn',
        );
      }}
    />
  );
};
