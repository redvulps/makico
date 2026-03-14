export interface AppInfoDto {
  readonly name: string;
  readonly platform: string;
  readonly versions: {
    readonly chrome: string;
    readonly electron: string;
    readonly node: string;
    readonly v8: string;
  };
}
