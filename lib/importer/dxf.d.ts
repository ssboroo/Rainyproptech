declare module "dxf" {
  export class Helper {
    constructor(text: string);
    parsed: { entities: { type: string }[] };
    denormalised: { type: string }[];
    toSVG(): string;
  }
}
