import {
  DISCORD_HREF,
  IMAGE_DISCORD_HREF,
  IMAGE_TWITTER_HREF,
  PAGE_HEIGHT,
  PAGE_WIDTH,
  TWITTER_HREF,
} from '@warcats/frontend';
import {WarCatPanel} from './WarCatPanel';
import {BuyButton, SocialButton} from './buttons';

export const Home = () => {
  return (
    <WarCatPanel width={PAGE_WIDTH} height={PAGE_HEIGHT}>
      <SocialButton
        x="468"
        y="3043"
        href={TWITTER_HREF}
        imageHref={IMAGE_TWITTER_HREF}
      />
      <SocialButton
        x="455"
        y="3178"
        href={DISCORD_HREF}
        imageHref={IMAGE_DISCORD_HREF}
      />
      <BuyButton x="400" y="3410" />
    </WarCatPanel>
  );
};
