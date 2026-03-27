export interface PowerTypeParams {
  id: string;
  name: string;
  damage: number;
  hardness: number;
  dif: number;
  size: string;
  range: string;
}

export const NARUTO_POWER_TYPES: PowerTypeParams[] = [
  { id: 'ninpou',        name: 'Ninpou',             damage: 0, hardness: 0, dif: 0, size: '1m/Nv Espírito',      range: '10m + 2m/Nv Espírito' },
  { id: 'doton',         name: 'Doton',              damage: 0, hardness: 2, dif: 0, size: '1m/Nv Espírito',      range: '5m + 1m/Nv Espírito' },
  { id: 'fuuton',        name: 'Fuuton',             damage: 2, hardness: 0, dif: 0, size: '1m/Nv Espírito',      range: '10m + 2m/Nv Espírito' },
  { id: 'katon',         name: 'Katon',              damage: 2, hardness: 0, dif: 0, size: '2m/Nv Espírito',      range: '10m + 2m/Nv Espírito' },
  { id: 'raiton',        name: 'Raiton',             damage: 1, hardness: 0, dif: 0, size: '0,5m/Nv Espírito',    range: '15m + 3m/Nv Espírito' },
  { id: 'suiton',        name: 'Suiton',             damage: 0, hardness: 0, dif: 0, size: '1m/Nv Espírito',      range: '10m + 2m/Nv Espírito' },
  { id: 'kkaiNinpou',    name: 'Kikai Ninpou',       damage: 0, hardness: 0, dif: 0, size: '1m/Nv L.Animais',    range: '10m + 2m/Nv L.Animais' },
  { id: 'mokuton',       name: 'Mokuton',            damage: 1, hardness: 0, dif: 1, size: '1m/Nv Espírito',      range: '10m + 2m/Nv Espírito' },
  { id: 'hyouton',       name: 'Hyouton',            damage: 0, hardness: 2, dif: 1, size: '1m/Nv Espírito',      range: '10m + 2m/Nv Espírito' },
  { id: 'sabaku',        name: 'Sabaku Hijutsu',     damage: 0, hardness: 2, dif: 0, size: '2m/Nv Espírito',      range: '10m + 2m/Nv Espírito' },
  { id: 'yonbiYoutton',  name: 'Yonbi Youtton',      damage: 2, hardness: 0, dif: 0, size: '2m/Nv Espírito',      range: '15m + 3m/Nv Espírito' },
  { id: 'kamiNinpou',    name: 'Kami Ninpou',        damage: 1, hardness: 0, dif: 0, size: '1m/Nv Esp./Arte',     range: '10m + 2m/Nv Esp./Arte' },
  { id: 'kujakuMyoho',   name: 'Kujaku Myoho',       damage: 1, hardness: 0, dif: 0, size: '2m/Nv Espírito',      range: '10m + 2m/Nv Espírito' },
  { id: 'sumiNinpou',    name: 'Sumi Ninpou',        damage: 0, hardness: 1, dif: 1, size: '1m/Nv Arte',          range: '15m + 3m/Nv Arte' },
  { id: 'kumoNinpou',    name: 'Kumo Ninpou',        damage: 0, hardness: 0, dif: 1, size: '1m/Nv Espírito',      range: '15m + 3m/Nv Espírito' },
  { id: 'hebiNinpou',    name: 'Hebi Ninpou',        damage: 0, hardness: 0, dif: 1, size: '1m/Nv Espírito',      range: '5m + 1m/Nv Espírito' },
  { id: 'ototon',        name: 'Ototon',             damage: 0, hardness: 0, dif: 1, size: '1m/Nv Espírito',      range: '5m + 1m/Nv Espírito' },
  { id: 'sakin',         name: 'Sakin',              damage: 0, hardness: 2, dif: 0, size: '1m/Nv Espírito',      range: '10m + 2m/Nv Espírito' },
  { id: 'satetsu',       name: 'Satetsu',            damage: 1, hardness: 0, dif: 0, size: '1m/Nv Espírito',      range: '10m + 2m/Nv Espírito' },
  { id: 'kibakuNendo',   name: 'Kibaku Nendo',       damage: 2, hardness: 0, dif: 0, size: '2m/Nv Arte',          range: '15m + 3m/Nv Arte' },
  { id: 'ranton',        name: 'Ranton',             damage: 1, hardness: 0, dif: 0, size: '1m/Nv Espírito',      range: '15m + 3m/Nv Espírito' },
  { id: 'shakuton',      name: 'Shakuton',           damage: 2, hardness: 0, dif: 0, size: '1m/Nv Espírito',      range: '10m + 2m/Nv Espírito' },
  { id: 'shouton',       name: 'Shouton',            damage: 0, hardness: 2, dif: 1, size: '1m/Nv Espírito',      range: '10m + 2m/Nv Espírito' },
  { id: 'shokubutsuton', name: 'Shokubutsuton',      damage: 1, hardness: 0, dif: 0, size: '1m/Nv Espírito',      range: '10m + 2m/Nv Espírito' },
  { id: 'yumeNinpou',    name: 'Yume Ninpou',        damage: 0, hardness: 0, dif: 1, size: '1m/Nv Espírito',      range: '5m + 1m/Nv Espírito' },
  { id: 'hikariton',     name: 'Hikariton',          damage: 0, hardness: 0, dif: 0, size: '1m/Nv Espírito',      range: '10m + 2m/Nv Espírito' },
  { id: 'kyudoNinpou',   name: 'Kyudo Ninpou',       damage: 0, hardness: 0, dif: 0, size: '0,5m/Nv Espírito',    range: 'Alcance Arco + 2m/Nv Esp.' },
  { id: 'tayouton',      name: 'Tayouton',           damage: 3, hardness: 0, dif: 0, size: '0,5m/Nv Espírito',    range: '10m + 2m/Nv Espírito' },
  { id: 'dokujutsu',     name: 'Dokujutsu',          damage: 0, hardness: 0, dif: 1, size: '1m/Nv Venefício',     range: '10m + 2m/Nv Venefício' },
  { id: 'yotonMei',      name: 'Yoton (Mei)',        damage: 1, hardness: 0, dif: 0, size: '2m/Nv Espírito',      range: '15m + 3m/Nv Espírito' },
  { id: 'futtonMei',     name: 'Futton (Mei)',       damage: 2, hardness: 0, dif: 1, size: '2m/Nv Espírito',      range: '10m + 2m/Nv Espírito' },
];
