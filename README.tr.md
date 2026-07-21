# HOODIEPAD 🧥⚡

> 🇬🇧 **For English documentation → [README.md](README.md)**

**Sıfır kodla kendi pump.fun'ını kur.**

HOODIEPAD, EVM üzerinde çalışan bir **launchpad fabrikasıdır**: herkes kısa bir sihirbazı doldurarak dakikalar içinde `site.com/<launcher-adi>` adresinde kendi pump.fun tarzı token launcher'ını yayınlar. Herhangi bir launcher'da oluşturulan **her token zorunlu olarak $HOODIE ile eşleşir** (`0xC72c01AAB5f5678dc1d6f5C6d2B417d91D402Ba3`): bonding curve üzerindeki tüm alım-satım HOODIE ile yapılır ve token mezun olduğunda likidite, LP'nin %100'ü yakılmış şekilde Uniswap V2 **TOKEN/HOODIE** havuzuna taşınır. Tüm platform **pixel art** dilinde ve **Robin Neon (`#CCFF00`)** temasındadır.

```
┌───────────────────────── FRONTEND (web/, Next.js 14) ─────────────────────────┐
│  ana site · /create sihirbazı · /[slug] temalı launcher'lar · trade sayfası   │
└──────────────┬──────────────────────────────────┬─────────────────────────────┘
               │ wagmi/viem                       │ REST
┌──────────────▼──────────────┐      ┌────────────▼──────────────────────────────┐
│  KONTRATLAR (contracts/)    │      │  INDEXER + API (indexer/, Ponder)         │
│  LauncherRegistry           │      │  eventler → Postgres → OHLCV mumları      │
│  TokenFactory (EIP-1167)    │      │  /api/launchers /api/tokens/:a/candles …  │
│  BondingCurve (HOODIE x·y=k)│      └───────────────────────────────────────────┘
│  GraduationManager          │      ┌───────────────────────────────────────────┐
│  FeeSplitter + Timelock48   │      │  EXPORT (export-template/)                │
└─────────────────────────────┘      │  GitHub/ZIP ile dışa aktarılan bağımsız   │
                                     │  launcher; aynı kontratlar + public API   │
                                     └───────────────────────────────────────────┘
```

**Kritik mimari karar:** Launcher'lar için ayrı kontrat deploy **edilmez**. Tek bir paylaşımlı, değiştirilemez kontrat seti herkese hizmet verir; launcher = on-chain bir kayıt (ücret alıcısı + parametreler) + off-chain tema config'i.

## Ekran görüntüleri

| Ana sayfa | Trade sayfası |
|---|---|
| ![Ana sayfa](docs/screenshots/home.png) | ![Trade](docs/screenshots/trade.png) |

| Keşfet | Launcher sihirbazı |
|---|---|
| ![Keşfet](docs/screenshots/explore.png) | ![Sihirbaz](docs/screenshots/wizard.png) |

| "Klasik Arcade" şeması | "Terminal" şeması |
|---|---|
| ![Arcade şeması](docs/screenshots/launcher-arcade.png) | ![Terminal şeması](docs/screenshots/launcher-terminal.png) |

## Monorepo

| Paket | İçerik | Durum |
|---|---|---|
| [`contracts/`](contracts/) | Foundry projesi: registry, factory, curve, graduation, fee splitter, 48s timelock, unit + fuzz testleri | ✅ temiz derleniyor, yaşam döngüsü E2E doğrulandı |
| [`web/`](web/) | Next.js 14 ana uygulama: Pixel Arcade tasarım sistemi, 12 maskot, 5 adımlı sihirbaz, 3 şema, trade sayfası | ✅ build geçiyor |
| [`indexer/`](indexer/) | Ponder indexer: trade → OHLCV (1m/5m/1h/1d), REST API | ✅ typecheck temiz |
| [`export-template/`](export-template/) | Launcher sahibinin GitHub/ZIP ile dışa aktardığı bağımsız arayüz | ✅ build geçiyor |

---

## 1. Lokalde çalıştır (2 dakikada arayüzü gör)

Gereksinimler: **Node.js ≥ 20** ve **pnpm ≥ 9** (`npm i -g pnpm`).

```bash
git clone https://github.com/henrydev-dot/HOOOODLauncher.git
cd HOOOODLauncher
pnpm install
pnpm dev          # → http://localhost:3000
```

Bu kadar. **Hiçbir ayar yapmadan** uygulama **demo modda** açılır: tüm sayfalar (ana sayfa, keşfet, sihirbaz, üç temalı demo launcher, mum grafikli trade sayfası) gerçekçi yerleşik mock verilerle çalışır; cüzdan akışları işlemi simüle eder. Gezilecek demo launcher'lar:

- `http://localhost:3000/hoodie-arcade` — "Klasik Arcade" şeması (King of the Hill)
- `http://localhost:3000/neon-terminal` — "Terminal" şeması (canlı ticker)
- `http://localhost:3000/meme-vitrin` — "Vitrin" şeması (hero + maskot)

Env'e kontrat adreslerini girdiğin anda gerçek on-chain akışlar otomatik devreye girer (aşağıda).

---

## 2. Frontend'i deploy et (Vercel — ~5 dakika)

1. **[vercel.com/new](https://vercel.com/new)** adresine git, bu GitHub reposunu import et.
2. **Root Directory** olarak `web` seç (Framework: Next.js — otomatik algılanır).
3. **Deploy**'a bas. Demo mod için hiçbir env değişkeni gerekmez — site hemen yayında olur.
4. (Sonrası) Gerçek veriye geçmek için *Project → Settings → Environment Variables* altına:

| Değişken | Ne |
|---|---|
| `NEXT_PUBLIC_CHAIN_ID` | Sepolia için `11155111`, mainnet için `1` |
| `NEXT_PUBLIC_REGISTRY_ADDRESS` | LauncherRegistry adresi (bunu girmek demo modu kapatır) |
| `NEXT_PUBLIC_FACTORY_ADDRESS` | TokenFactory adresi |
| `NEXT_PUBLIC_CURVE_ADDRESS` | BondingCurve adresi |
| `NEXT_PUBLIC_GRADUATION_ADDRESS` | GraduationManager adresi |
| `NEXT_PUBLIC_FEESPLITTER_ADDRESS` | FeeSplitter adresi |
| `NEXT_PUBLIC_HOODIE_ADDRESS` | HOODIE token (varsayılan `0xC72c...2Ba3`; testnette MockHoodie adresin) |
| `NEXT_PUBLIC_API_URL` | Indexer API adresi (boş = mock veri) |
| `NEXT_PUBLIC_WC_PROJECT_ID` | WalletConnect Cloud proje id'si (cloud.walletconnect.com — ücretsiz) |

Tam şablon: [`web/.env.example`](web/.env.example). `main`'e atılan her push otomatik yeniden deploy olur.

---

## 3. Kontratları deploy et

### 3a. Sepolia testnet (güvenli, ücretsiz — önce bunu yap)

[Foundry](https://getfoundry.sh) gerekir (`curl -L https://foundry.paradigm.xyz | bash && foundryup`) + Sepolia ETH'li boş bir test cüzdanı ([faucet](https://sepoliafaucet.com)).

```bash
cd contracts
forge build && forge test        # hepsi yeşil olmalı

TREASURY=<senin_adresin> \
UNIV2_FACTORY=0xF62c03E08ada871A0bEb309762E260a7a6a880E6 \
UNIV2_ROUTER=0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3 \
forge script script/Deploy.s.sol \
  --rpc-url https://ethereum-sepolia-rpc.publicnode.com \
  --private-key <DEPLOY_KEY> --broadcast
```

`HOODIE` env'ini boş bırakırsan script otomatik bir **MockHoodie** deploy eder — `mint(address,uint256)` çağırarak kendine bedava test HOODIE'si basarsın. Script çıktısındaki adresleri frontend + indexer env'lerine kopyaladığında tüm yaşam döngüsü (launcher kur → token yarat → al-sat → Uniswap'a mezun et) sıfır parasal riskle uçtan uca çalışır.

### 3b. Ethereum mainnet — ⚠️ önce bunu oku

**Mainnet'e doğrudan deploy etme.** Bu platform gerçek kullanıcıların HOODIE'sini tutacak. Zorunlu ön koşullar ([`contracts/README.md`](contracts/README.md)):

1. **HOODIE token'ını Etherscan'de doğrula**: `0xC72c...2Ba3` gerçekten hedeflediğin ağda mı, 18 decimal mı, transfer vergisi / pause / upgrade var mı?
2. **Parametreleri kalibre et**: 85M HOODIE mezuniyet eşiği ve 50k kuruluş ücreti spec'in adet bazlı varsayılanları — HOODIE fiyatına göre ayarla.
3. **Bağımsız güvenlik denetimi** (firma ve/veya Code4rena/Sherlock yarışması) + bug bounty.
4. Sonra aynı deploy komutu mainnet değerleriyle: `UNIV2_FACTORY=0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f`, `UNIV2_ROUTER=0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D`, `HOODIE=0xC72c01AAB5f5678dc1d6f5C6d2B417d91D402Ba3` ve Etherscan doğrulaması için `--verify`. Registry'yi `Timelock48`'e devret (deploy script'i bunu başlatıyor) ve küçük tutarlarla soft-launch yap.

---

## 4. Indexer'ı deploy et (mock yerine gerçek veri)

1. [neon.tech](https://neon.tech)'ten (veya Supabase) ücretsiz Postgres aç.
2. [Railway](https://railway.app) / [Fly.io](https://fly.io)'da repoyu `indexer` kök dizini ile deploy et (start komutu `pnpm start`).
3. [`indexer/.env.example`](indexer/.env.example)'daki env'leri gir: `DATABASE_URL`, `CHAIN_ID`, `PONDER_RPC_URL_11155111` (veya `_1`), dört kontrat adresi ve deploy blok numaraları.
4. Frontend'in `NEXT_PUBLIC_API_URL`'ini indexer'ın public URL'ine çevir. Grafikler, sahip listesi ve işlem akışı otomatik olarak canlı veriye geçer.

---

## Ücret ekonomisi (varsayılanlar — 48 saatlik timelock arkasında, üst sınırlı)

| Ücret | Değer | Kime |
|---|---|---|
| Launcher kurma | 50.000 HOODIE | Platform hazinesi |
| Token oluşturma | 500 HOODIE | %50 platform / %50 launcher sahibi |
| Trade ücreti | %1 | launcher payı = kendi `launcherFeeBps`'i (%0–1), kalan platforma |
| Graduation ücreti | Toplanan HOODIE'nin %2'si | Platform hazinesi |
| Graduate çağrı teşviki | %0,05 | `graduate()` çağıran adres |

## Token yaşam döngüsü

1. **Yarat** — 1 milyar sabit arz doğrudan paylaşımlı bonding curve'e mint edilir. Owner yok, mint yok, vergi yok. Opsiyonel atomik "dev buy".
2. **Al-sat** — sanal rezervli sabit çarpım eğrisi (300M HOODIE / 1.073M token). Slippage koruması zorunlu; fiyat yalnızca curve state'inden gelir.
3. **Mezun ol** — 85M HOODIE gerçek rezervde curve donar; herkes `graduate()` çağırabilir: Uniswap V2 TOKEN/HOODIE havuzu kurulur, **LP'nin %100'ü `0xdead`'e yakılır** (veya config ile 12 ay kilit), kalan envanter yakılır.

## Spec'ten sapmalar

- **OpenZeppelin importları yerine vendored mikro-kütüphaneler** (`contracts/src/vendor/`): aynı semantik, sıfır submodule → `forge build` çevrimdışı çalışır.
- **OZ `TimelockController` yerine `Timelock48`**: bilinçli olarak minicik 48s queue/execute/cancel — daha küçük denetim yüzeyi, aynı garanti.
- **Trade ücreti uzlaşısı**: toplam ücret sabit %1; launcher payı = kendi `launcherFeeBps`'i (varsayılan 50 bps = %0,5), kalan platforma.
- **Eşik vs. arz tükenmesi**: varsayılan rezervlerle 85M eşiği ~237M token satıldığında curve'ü kapatır; satılmamış envanter mezuniyette yakılır, LP tahsisi tam 206,9M kalır.
- **Foundry testleri forge-std yerine repo içi minimal cheatcode arayüzü kullanır**; ayrıca tüm yaşam döngüsü gerçek bir EVM'de çalıştırıldı (20/20 kontrol yeşil).
- **WebSocket push, IPFS pinleme ve GitHub OAuth export** backend implementasyonu bekleyen stub API yüzeyleridir.

## Risk notları

On-chain her şey değiştirilemez ve izinsizdir: HOODIEPAD on-chain veriyi sansürleyemez, yalnızca kendi arayüzünden gizleyebilir. Tokenlar token seviyesinde rug'a kapalıdır (mint yok, owner yok, LP yakılır) ama son derece spekülatiftir. **Denetimsiz mainnet deploy'u yapma.**

## Lisans

MIT — bkz. [LICENSE](LICENSE).
