import { Composition } from "remotion";
import { AnjoHero } from "./AnjoHero";

export const Root = () => (
  <>
    <Composition id="AnjoHero" component={AnjoHero} durationInFrames={300} fps={30} width={1920} height={1080} defaultProps={{ layout: "wide" as const }} />
    <Composition id="AnjoHeroVertical" component={AnjoHero} durationInFrames={300} fps={30} width={1080} height={1920} defaultProps={{ layout: "tall" as const }} />
  </>
);
