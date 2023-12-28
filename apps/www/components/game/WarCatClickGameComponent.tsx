import {WarCatTitleUi, BabylonScene} from '@warcats/frontend';

export const WarCatClickGameComponent = () => {
  return (
    <>
      <p style={{color: 'white', fontFamily: 'ThaleahFat'}}>Testing</p>
      <BabylonScene onSceneReady={WarCatTitleUi.createInstance} />;
    </>
  );
};
