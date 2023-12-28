import {Engine, Scene} from 'babylonjs';
import {useEffect, useRef, useState} from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Props = any;

export const BabylonScene = (props: Props) => {
  const reactCanvas = useRef(null);
  const {
    antialias,
    engineOptions,
    adaptToDeviceRatio,
    sceneOptions,
    onRender,
    onSceneReady,
    ...rest
  } = props;

  const [loaded, setLoaded] = useState<boolean>(false);
  const [scene, setScene] = useState<Scene | null>(null);

  useEffect(() => {
    if (window) {
      const resize = () => {
        if (scene) {
          scene.getEngine().resize();
        }
      };
      window.addEventListener('resize', resize);

      return () => {
        window.removeEventListener('resize', resize);
      };
    }
  }, [scene]);

  useEffect(() => {
    if (!loaded) {
      setLoaded(true);
      const engine = new Engine(
        reactCanvas.current,
        antialias,
        engineOptions,
        adaptToDeviceRatio,
      );
      const scene = new Scene(engine, sceneOptions);
      setScene(scene);
      if (scene.isReady()) {
        props.onSceneReady(scene);
      } else {
        scene.onReadyObservable.addOnce((scene) => props.onSceneReady(scene));
      }

      engine.runRenderLoop(() => {
        if (typeof onRender === 'function') {
          onRender(scene);
        }
        scene.render();
      });
    }

    return () => {
      if (scene !== null) {
        scene.dispose();
      }
    };
  }, [
    adaptToDeviceRatio,
    antialias,
    engineOptions,
    loaded,
    onRender,
    props,
    reactCanvas,
    scene,
    sceneOptions,
  ]);

  return <canvas className="gamepanel" ref={reactCanvas} {...rest} />;
};
