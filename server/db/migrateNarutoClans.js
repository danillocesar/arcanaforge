const NarutoClan = require('./models/NarutoClan');

const DEFAULT_CLANS = [
  { _id: 'aburame', name: 'Aburame', icon: '/assets/clans/icons/aburame.svg' },
  { _id: 'akimichi', name: 'Akimichi', icon: '/assets/clans/icons/akimichi.svg' },
  { _id: 'aokiba', name: 'Aokiba', icon: '/assets/clans/icons/aokiba.svg' },
  { _id: 'dokujutsu', name: 'Dokujutsu', icon: '/assets/clans/icons/dokujutsu.svg' },
  { _id: 'fuuma', name: 'Fuuma', icon: '/assets/clans/icons/fuuma.svg' },
  { _id: 'hachimon-tonkou', name: 'Hachimon Tonkou', icon: '/assets/clans/icons/hachimon-tonkou.svg' },
  { _id: 'hatake', name: 'Hatake', icon: '/assets/clans/icons/hatake.svg' },
  { _id: 'hibon-ninpou', name: 'Hibon Ninpou', icon: '/assets/clans/icons/hibon-ninpou.svg' },
  { _id: 'hoshigaki', name: 'Hoshigaki', icon: '/assets/clans/icons/hoshigaki.svg' },
  { _id: 'hozuki', name: 'Hozuki', icon: '/assets/clans/icons/hozuki.svg' },
  { _id: 'hyuuga', name: 'Hyuuga', icon: '/assets/clans/icons/hyuuga.svg' },
  { _id: 'inuzuka', name: 'Inuzuka', icon: '/assets/clans/icons/inuzuka.svg' },
  { _id: 'jinchuuriki', name: 'Jinchuuriki (1 a 9 caudas)', icon: '/assets/clans/icons/jinchuuriki.svg' },
  { _id: 'jiton', name: 'Jiton', icon: '/assets/clans/icons/jiton.svg' },
  { _id: 'juuinka', name: 'Juuinka', icon: '/assets/clans/icons/juuinka.svg' },
  { _id: 'kaguya', name: 'Kaguya', icon: '/assets/clans/icons/kaguya.svg' },
  { _id: 'kamijutsu', name: 'Kamijutsu', icon: '/assets/clans/icons/kamijutsu.svg' },
  { _id: 'kuchiyose', name: 'Kuchiyose', icon: '/assets/clans/icons/kuchiyose.svg' },
  { _id: 'kuchiyose-macaco', name: 'Kuchiyose: Macaco', icon: '/assets/clans/icons/kuchiyose-macaco.svg' },
  { _id: 'magen', name: 'Magen', icon: '/assets/clans/icons/magen.svg' },
  { _id: 'nara', name: 'Nara', icon: '/assets/clans/icons/nara.svg' },
  { _id: 'nintaijutsu', name: 'Nintaijutsu', icon: '/assets/clans/icons/nintaijutsu.svg' },
  { _id: 'rinnegan', name: 'Rinnegan', icon: '/assets/clans/icons/rinnegan.svg' },
  { _id: 'saika-ikki', name: 'Saika Ikki', icon: '/assets/clans/icons/saika-ikki.svg' },
  { _id: 'samurai', name: 'Samurai', icon: '/assets/clans/icons/samurai.svg' },
  { _id: 'sarutobi', name: 'Sarutobi', icon: '/assets/clans/icons/sarutobi.svg' },
  { _id: 'senju', name: 'Senju', icon: '/assets/clans/icons/senju.svg' },
  { _id: 'senjutsu', name: 'Senjutsu', icon: '/assets/clans/icons/senjutsu.svg' },
  { _id: 'senninka', name: 'Senninka', icon: '/assets/clans/icons/senninka.svg' },
  { _id: 'tensai', name: 'Tensai', icon: '/assets/clans/icons/tensai.svg' },
  { _id: 'uchiha', name: 'Uchiha', icon: '/assets/clans/icons/uchiha.svg' },
  { _id: 'uzumaki', name: 'Uzumaki', icon: '/assets/clans/icons/uzumaki.svg' },
  { _id: 'yamanaka', name: 'Yamanaka', icon: '/assets/clans/icons/yamanaka.svg' },
  { _id: 'yotsuki', name: 'Yotsuki', icon: '/assets/clans/icons/yotsuki.svg' },
  { _id: 'yuki', name: 'Yuki', icon: '/assets/clans/icons/yuki.svg' },
].map((c) => ({ ...c, system: 'naruto', active: true }));

async function run() {
  let upserts = 0;
  for (const clan of DEFAULT_CLANS) {
    await NarutoClan.findByIdAndUpdate(
      clan._id,
      { $setOnInsert: clan },
      { upsert: true, new: false },
    );
    upserts++;
  }
  console.log(`[migrateNarutoClans] Ensured ${upserts} default clans.`);
}

module.exports = { run };
