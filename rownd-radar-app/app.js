// =================================================================
// ROWND PRECISION - LIVE OPERATIONS RADAR (PI 5 & SMART AUDIO EDITION)
// =================================================================

const REALISTIC_EXPORT_COUNTRIES = [
  "United States of America", "Canada", "Mexico",
  "Germany", "France", "United Kingdom", "Italy", "Spain", "Netherlands",
  "Belgium", "Switzerland", "Austria", "Ireland", "Portugal", "Luxembourg",
  "Greece", "Cyprus", "Malta",
  "Sweden", "Norway", "Denmark", "Finland", "Iceland",
  "Estonia", "Latvia", "Lithuania",
  "Poland", "Czech Republic", "Czechia", "Slovakia", "Hungary", "Romania",
  "Bulgaria", "Croatia", "Slovenia",
  "Japan", "South Korea", "Republic of Korea", "Taiwan", "Hong Kong",
  "Singapore", "Australia", "New Zealand", "Philippines"
];

const COUNTRY_NAME_MAP = {
  "türkiye": ["turkey", "türkiye", "tur"],
  "turkey": ["turkey", "türkiye", "tur"],
  "abd": ["united states of america", "united states", "usa", "us"],
  "amerika": ["united states of america", "united states", "usa"],
  "united states of america": ["united states of america", "united states", "usa"],
  "kanada": ["canada", "can"],
  "canada": ["canada", "can"],
  "meksika": ["mexico", "mex"],
  "mexico": ["mexico", "mex"],
  "almanya": ["germany", "deutschland", "deu"],
  "germany": ["germany", "deutschland", "deu"],
  "fransa": ["france", "fransa", "fra"],
  "france": ["france", "fransa", "fra"],
  "italya": ["italy", "italia", "ita"],
  "italy": ["italy", "italia", "ita"],
  "ingiltere": ["united kingdom", "uk", "great britain", "gbr"],
  "birleşik krallık": ["united kingdom", "uk", "great britain", "gbr"],
  "united kingdom": ["united kingdom", "uk", "great britain", "gbr"],
  "belçika": ["belgium", "belgique", "bel"],
  "belgium": ["belgium", "belgique", "bel"],
  "japonya": ["japan", "jpn"],
  "japan": ["japan", "jpn"],
  "hong kong": ["hong kong", "hkg"],
  "filipinler": ["philippines", "phl"],
  "philippines": ["philippines", "phl"],
  "ispanya": ["spain", "españa", "esp"],
  "hollanda": ["netherlands", "nld"],
  "isviçre": ["switzerland", "che"],
  "avusturya": ["austria", "aut"],
  "polonya": ["poland", "pol"],
  "isveç": ["sweden", "swe"],
  "norveç": ["norway", "nor"],
  "danimarka": ["denmark", "dnk"],
  "finlandiya": ["finland", "fin"],
  "irlanda": ["ireland", "irl"],
  "portekiz": ["portugal", "prt"],
  "çekya": ["czech republic", "czechia", "cze"],
  "macaristan": ["hungary", "hun"],
  "romanya": ["romania", "rou"],
  "yunanistan": ["greece", "grc"],
  "rusya": ["russia", "russian federation", "rus"],
  "russia": ["russia", "russian federation", "rus"],
  "azerbaycan": ["azerbaijan", "aze"],
  "güney kore": ["south korea", "republic of korea", "korea", "kor"],
  "singapur": ["singapore", "sgp"],
  "avustralya": ["australia", "aus"],
  "yeni zelanda": ["new zealand", "nzl"],
  "tayvan": ["taiwan", "twn"]
};

function normalizeName(str) {
  if (!str) return '';
  return str.toString().trim().toLowerCase()
    .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i')
    .replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u');
}

function matchCountry(mapCountryName, targetCountryName) {
  if (!mapCountryName || !targetCountryName) return false;
  const nMap = normalizeName(mapCountryName);
  const nTarget = normalizeName(targetCountryName);

  if (nMap === nTarget) return true;

  const targetAliases = COUNTRY_NAME_MAP[nTarget] || [];
  if (targetAliases.some(a => normalizeName(a) === nMap)) return true;

  const mapAliases = COUNTRY_NAME_MAP[nMap] || [];
  if (mapAliases.some(a => normalizeName(a) === nTarget)) return true;

  return false;
}

function cleanCityName(cityStr) {
  if (!cityStr) return '';
  return cityStr.replace(/\s*\([^)]*\)/g, '').trim();
}

let ACTIVE_SALES_LOCATIONS = [];
try {
  const saved = localStorage.getItem('rownd_custom_locations');
  if (saved) {
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed) && parsed.length > 0) {
      ACTIVE_SALES_LOCATIONS = parsed.map(loc => ({
        ...loc,
        city: cleanCityName(loc.city)
      }));
    }
  }
} catch (e) {}

if (ACTIVE_SALES_LOCATIONS.length === 0 && typeof SALES_LOCATIONS !== 'undefined') {
  ACTIVE_SALES_LOCATIONS = SALES_LOCATIONS.map(loc => ({
    ...loc,
    city: cleanCityName(loc.city)
  }));
}

function getCountryColorType(featureProps) {
  if (!featureProps) return 'other';

  const possibleNames = [
    featureProps.ADMIN,
    featureProps.NAME,
    featureProps.NAME_LONG,
    featureProps.SOVEREIGNT,
    featureProps.ISO_A2,
    featureProps.ISO_A3
  ].filter(Boolean);

  const isTr = possibleNames.some(n => matchCountry(n, "Turkey") || matchCountry(n, "Türkiye"));
  if (isTr) return 'turkey';

  const isRealisticMarket = REALISTIC_EXPORT_COUNTRIES.some(marketCountry => 
    possibleNames.some(n => matchCountry(n, marketCountry))
  );
  if (isRealisticMarket) return 'highlighted';

  const hasCustomer = ACTIVE_SALES_LOCATIONS.some(loc => 
    loc.country && possibleNames.some(n => matchCountry(n, loc.country))
  );
  if (hasCustomer) return 'highlighted';

  return 'other';
}

function buildAllLocations(salesList) {
  return [
    {
      ...HQ_LOCATION,
      city: cleanCityName(HQ_LOCATION.city),
      type: 'hq',
      displayLabel: 'BURSA NİLÜFER',
      color: '#38bdf8',
      radius: 0.28,
      altitude: 0.02
    },
    ...salesList.map(loc => ({
      ...loc,
      city: cleanCityName(loc.city),
      type: 'sale',
      color: '#34d399',
      radius: 0.22,
      altitude: 0.015
    }))
  ];
}

let ALL_LOCATIONS = buildAllLocations(ACTIVE_SALES_LOCATIONS);
let currentActiveTargetId = null;

function getActiveRingsData() {
  const hq = ALL_LOCATIONS.find(l => l.type === 'hq');
  const target = ALL_LOCATIONS.find(l => l.id === currentActiveTargetId);
  return target ? [hq, target] : (hq ? [hq] : []);
}

function buildArcData() {
  return ACTIVE_SALES_LOCATIONS.map(loc => ({
    targetId: loc.id,
    startLat: HQ_LOCATION.lat,
    startLng: HQ_LOCATION.lng,
    endLat: loc.lat,
    endLng: loc.lng
  }));
}

const WEATHER_ICONS = {
  0: { label: "Açık", icon: "☀️" },
  1: { label: "Az Bulutlu", icon: "🌤️" },
  2: { label: "Parçalı Bulutlu", icon: "⛅" },
  3: { label: "Çok Bulutlu", icon: "☁️" },
  45: { label: "Sisli", icon: "🌫️" },
  48: { label: "Yoğun Sis", icon: "🌫️" },
  51: { label: "Çiseleme", icon: "🌦️" },
  61: { label: "Yağmurlu", icon: "🌧️" },
  65: { label: "Kuvvetli Yağmur", icon: "⛈️" },
  71: { label: "Kar Yağışlı", icon: "❄️" },
  80: { label: "Sağanak", icon: "🌦️" },
  95: { label: "Fırtına", icon: "⚡" }
};

// =================================================================
// 2. 3D DÜNYA SAHNESİ & PI 5 DONANIM KİLİDİ
// =================================================================
const globeContainer = document.getElementById('globeViz');
const world = Globe()(globeContainer);

const isLinuxARM = /arm|aarch64|linux/i.test(navigator.userAgent) && !/android/i.test(navigator.userAgent);
try {
  if (world.renderer()) {
    const targetPixelRatio = isLinuxARM ? 0.80 : Math.min(window.devicePixelRatio, 1.15);
    world.renderer().setPixelRatio(targetPixelRatio);
    world.renderer().powerPreference = "high-performance";
  }
} catch(e) {}

world
  .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-night.jpg')
  .backgroundImageUrl('https://unpkg.com/three-globe/example/img/night-sky.png')
  .showAtmosphere(true)
  .atmosphereColor('#10b981')
  .atmosphereAltitude(0.14)
  .pointsData(ALL_LOCATIONS)
  .pointLat('lat')
  .pointLng('lng')
  .pointColor('color')
  .pointAltitude('altitude')
  .pointRadius('radius')
  .ringsData(getActiveRingsData())
  .ringLat('lat')
  .ringLng('lng')
  .ringColor(d => (t) => d.type === 'hq'
    ? `rgba(56, 189, 248, ${Math.sqrt(1 - t)})`
    : `rgba(52, 211, 153, ${Math.sqrt(1 - t)})`
  )
  .ringMaxRadius(d => d.type === 'hq' ? 2.0 : 1.4)
  .ringPropagationSpeed(d => d.type === 'hq' ? 1.4 : 1.0)
  .ringRepeatPeriod(d => d.type === 'hq' ? 1800 : 2200)

  // SADECE HEDEF FİRMAYA GİDEN LAZER HAREKET EDER, DİĞERLERİ SABİT VE SAKİNDİR
  .arcsData(buildArcData())
  .arcColor(d => d.targetId === currentActiveTargetId
    ? ['rgba(56, 189, 248, 1)', 'rgba(52, 211, 153, 1)']
    : ['rgba(56, 189, 248, 0.12)', 'rgba(52, 211, 153, 0.08)']
  )
  .arcStroke(d => d.targetId === currentActiveTargetId ? 0.70 : 0.18)
  .arcDashLength(d => d.targetId === currentActiveTargetId ? 0.45 : 1.0)
  .arcDashGap(d => d.targetId === currentActiveTargetId ? 0.25 : 0)
  .arcDashInitialGap(0)
  .arcDashAnimateTime(d => d.targetId === currentActiveTargetId ? 1800 : 0)
  .arcAltitudeAutoScale(0.32)

  .htmlElementsData([])
  .htmlLat('lat')
  .htmlLng('lng')
  .htmlAltitude(0.025)
  .htmlElement(d => {
    const el = document.createElement('div');
    el.innerHTML = `
      <div style="
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(9, 14, 28, 0.96);
        border: 1px solid rgba(56, 189, 248, 0.6);
        padding: 6px 14px;
        border-radius: 9999px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.7);
        color: #ffffff;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 13px;
        font-weight: 600;
        white-space: nowrap;
        transform: translate(-50%, -140%);
        pointer-events: none;
        user-select: none;
      ">
        <span style="width: 8px; height: 8px; border-radius: 50%; background: #34d399; box-shadow: 0 0 6px #34d399;"></span>
        <span style="color: #38bdf8; font-weight: 700; letter-spacing: 0.5px;">${d.displayLabel || d.customer}</span>
        <span style="color: #64748b;">•</span>
        <span style="color: #f1f5f9;">${d.city}</span>
      </div>
    `;
    return el;
  });

function updateArcVisuals() {
  world.arcsData(buildArcData());
}

let allCountryFeatures = [];

function updateCountryPolygons() {
  if (!allCountryFeatures.length) return;

  const highlightedFeatures = allCountryFeatures.filter(d => {
    return getCountryColorType(d.properties) !== 'other';
  });

  const cloned = highlightedFeatures.map(f => ({
    ...f,
    _key: Math.random()
  }));

  world
    .polygonsData(cloned)
    .polygonCapColor(d => {
      const type = getCountryColorType(d.properties);
      if (type === 'turkey') return 'rgba(56, 189, 248, 0.26)';
      return 'rgba(16, 185, 129, 0.22)';
    })
    .polygonSideColor(() => 'transparent')
    .polygonStrokeColor(d => {
      const type = getCountryColorType(d.properties);
      if (type === 'turkey') return 'rgba(56, 189, 248, 0.95)';
      return 'rgba(52, 211, 153, 0.90)';
    })
    .polygonAltitude(0.003);
}

function reloadGlobeData(newList) {
  ACTIVE_SALES_LOCATIONS = newList.map(loc => ({
    ...loc,
    city: cleanCityName(loc.city)
  }));

  try {
    localStorage.setItem('rownd_custom_locations', JSON.stringify(ACTIVE_SALES_LOCATIONS));
  } catch(e) {}

  ALL_LOCATIONS = buildAllLocations(ACTIVE_SALES_LOCATIONS);
  world.pointsData(ALL_LOCATIONS);
  world.ringsData(getActiveRingsData());
  updateArcVisuals();
  updateCountryPolygons();

  const activeCountEl = document.getElementById('active-count');
  if (activeCountEl) activeCountEl.innerText = "200+";
}

let sunLight = null;
let sunUniforms = null;

function calculateSubsolarPoint(date) {
  const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
  const declination = -23.44 * Math.cos((360 / 365) * (dayOfYear + 10) * (Math.PI / 180));
  const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  const sunLng = (12 - utcHours) * 15;
  return { lat: declination, lng: sunLng };
}

function updateSolarSystem() {
  const now = new Date();
  const solar = calculateSubsolarPoint(now);

  let sunVec = null;
  try {
    if (world && typeof world.getCoords === 'function') {
      const c = world.getCoords(solar.lat, solar.lng, 2.5);
      if (c && !isNaN(c.x)) {
        sunVec = new THREE.Vector3(c.x, c.y, c.z);
      }
    }
  } catch (e) {}

  if (!sunVec) {
    const phi = (90 - solar.lat) * (Math.PI / 180);
    const theta = (solar.lng + 180) * (Math.PI / 180);
    const r = 250;
    sunVec = new THREE.Vector3(
      -(r * Math.sin(phi) * Math.cos(theta)),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.sin(theta)
    );
  }

  if (sunLight) sunLight.position.copy(sunVec);
  if (sunUniforms && sunUniforms.sunPosition) {
    sunUniforms.sunPosition.value.copy(sunVec);
  }
}

try {
  sunLight = new THREE.DirectionalLight(0xfffaed, 2.0);
  world.scene().add(sunLight);

  const nightAmbient = new THREE.AmbientLight(0x061126, 0.65);
  world.scene().add(nightAmbient);

  const loader = new THREE.TextureLoader();
  const dayTexture = loader.load('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg');
  const nightTexture = loader.load('https://unpkg.com/three-globe/example/img/earth-night.jpg');

  dayTexture.minFilter = THREE.LinearFilter;
  dayTexture.generateMipmaps = false;
  nightTexture.minFilter = THREE.LinearFilter;
  nightTexture.generateMipmaps = false;

  const mat = world.globeMaterial();
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.dayTexture = { value: dayTexture };
    shader.uniforms.nightTexture = { value: nightTexture };
    shader.uniforms.sunPosition = { value: new THREE.Vector3(1, 0, 0) };
    sunUniforms = shader.uniforms;

    shader.vertexShader = `
      varying vec3 vWorldNormal;
      varying vec2 vUvCoord;
      ${shader.vertexShader}
    `.replace(
      '#include <worldpos_vertex>',
      `
      #include <worldpos_vertex>
      vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
      vUvCoord = uv;
      `
    );

    shader.fragmentShader = `
      uniform sampler2D dayTexture;
      uniform sampler2D nightTexture;
      uniform vec3 sunPosition;
      varying vec3 vWorldNormal;
      varying vec2 vUvCoord;
      ${shader.fragmentShader}
    `.replace(
      '#include <dithering_fragment>',
      `
      #include <dithering_fragment>
      float intensity = dot(vWorldNormal, normalize(sunPosition));
      
      if (intensity < -0.05) {
        gl_FragColor = texture2D(nightTexture, vUvCoord);
      } else if (intensity > 0.15) {
        gl_FragColor = texture2D(dayTexture, vUvCoord);
      } else {
        float mixFactor = smoothstep(-0.05, 0.15, intensity);
        vec4 dayColor = texture2D(dayTexture, vUvCoord);
        vec4 nightColor = texture2D(nightTexture, vUvCoord);
        gl_FragColor = mix(nightColor, dayColor, mixFactor);
      }
      `
    );

    updateSolarSystem();
  };
  mat.needsUpdate = true;
} catch(e) {}

updateSolarSystem();
setInterval(updateSolarSystem, 15000);

fetch('https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
  .then(res => res.json())
  .then(countries => {
    allCountryFeatures = countries.features || [];
    updateCountryPolygons();
  })
  .catch(err => console.warn('GeoJSON yüklenemedi:', err));

world.pointOfView({ lat: 39.0, lng: 35.0, altitude: 1.8 }, 1200);
world.controls().autoRotate = true;
world.controls().autoRotateSpeed = 0.35;

function updateLiveClocks() {
  const hqEl = document.getElementById('hq-clock');
  if (hqEl) {
    hqEl.innerText = new Intl.DateTimeFormat('tr-TR', {
      timeZone: 'Europe/Istanbul',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(new Date());
  }
}
setInterval(updateLiveClocks, 1000);
updateLiveClocks();

function getFormattedTime(timeZone) {
  try {
    return new Intl.DateTimeFormat('tr-TR', {
      timeZone: timeZone,
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date());
  } catch (e) {
    return "--:--";
  }
}

let activeWeatherController = null;
async function getWeatherDetails(lat, lng) {
  if (activeWeatherController) {
    activeWeatherController.abort();
  }
  activeWeatherController = new AbortController();

  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`, {
      signal: activeWeatherController.signal
    });
    const data = await res.json();
    if (data && data.current_weather) {
      const code = data.current_weather.weathercode;
      const temp = Math.round(data.current_weather.temperature);
      const iconData = WEATHER_ICONS[code] || { label: "Açık", icon: "☀️" };
      return `${iconData.icon} ${iconData.label} ${temp}°C`;
    }
  } catch (e) {
    if (e.name === 'AbortError') return null;
  }
  return "⛅ Parçalı Bulutlu 21°C";
}

// =================================================================
// 3. KİOSK HİKAYE VE VİTRİN MOTORU
// =================================================================
let currentIndex = 0;
let isInterrupted = false;
let storyCounter = 0;
let activeTimers = [];

function clearStoryTimers() {
  activeTimers.forEach(t => clearTimeout(t));
  activeTimers = [];
}

const card = document.getElementById('info-card');

function safeSetText(id, text) {
  const el = document.getElementById(id);
  if (el) el.innerText = text;
}

function updateModeBadge(isManual = false) {
  const badge = document.getElementById('kiosk-mode-badge');
  if (!badge) return;
  if (isManual) {
    badge.className = "ml-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono font-bold tracking-wider flex items-center gap-1.5 animate-pulse";
    badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-cyan-400"></span> MOBİL KUMANDA AKTİF`;
  } else {
    badge.className = "ml-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold tracking-wider flex items-center gap-1.5";
    badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> OTOMATİK TUR`;
  }
}

function startCardProgressBar(durationMs) {
  const bar = document.getElementById('card-progress-bar');
  if (!bar) return;
  bar.style.transition = 'none';
  bar.style.width = '0%';
  setTimeout(() => {
    bar.style.transition = `width ${durationMs}ms linear`;
    bar.style.width = '100%';
  }, 50);
}

function getStoryCameraPOV(target) {
  const isTurkey = (target.country || '').toLowerCase().includes('türki');
  const altitude = isTurkey ? 0.42 : 0.95;
  const latOffset = isTurkey ? 3.5 : 6.0;
  const lngOffset = isTurkey ? 6.5 : 12.0;

  return {
    lat: target.lat - latOffset,
    lng: target.lng - lngOffset,
    altitude: altitude
  };
}

function displayTargetCard(target, progressDuration = 8300) {
  safeSetText('card-country', target.country);
  safeSetText('card-city', target.customer);
  safeSetText('card-customer', `${cleanCityName(target.city)} • ${target.sector}`);
  safeSetText('card-usecase', target.useCase);
  safeSetText('card-machine', target.machine);
  safeSetText('card-time', `${getFormattedTime(target.timezone)} (Yerel)`);
  safeSetText('card-weather', "Hava durumu alınıyor...");

  getWeatherDetails(target.lat, target.lng).then(wText => {
    if (wText && currentActiveTargetId === target.id) {
      safeSetText('card-weather', wText);
    }
  });

  const partBox = document.getElementById('card-part-box');
  const partImg = document.getElementById('card-part-img');

  if (partBox && partImg && card) {
    if (target.partImage) {
      safeSetText('card-part-name', target.partName || "Hassas Talaşlı Parça");
      safeSetText('card-part-material', target.partMaterial || "Alüminyum 7075");
      safeSetText('card-part-tolerance', target.partTolerance || "±0.02 mm (20 µm)");

      partImg.onload = () => partImg.classList.remove('opacity-0');
      partImg.onerror = () => {
        partBox.classList.add('hidden');
        partBox.classList.remove('flex');
      };
      
      partImg.src = target.partImage;
      if (partImg.complete) partImg.classList.remove('opacity-0');

      partBox.classList.remove('hidden');
      partBox.classList.add('flex');
    } else {
      partBox.classList.add('hidden');
      partBox.classList.remove('flex');
    }
  }

  if (card) {
    card.classList.remove('opacity-0', 'translate-y-6');
    startCardProgressBar(progressDuration);
  }
}

async function playNextStory() {
  if (isInterrupted) return;

  if (ACTIVE_SALES_LOCATIONS.length === 0) {
    if (typeof SALES_LOCATIONS !== 'undefined' && SALES_LOCATIONS.length > 0) {
      ACTIVE_SALES_LOCATIONS = SALES_LOCATIONS.map(loc => ({
        ...loc,
        city: cleanCityName(loc.city)
      }));
      ALL_LOCATIONS = buildAllLocations(ACTIVE_SALES_LOCATIONS);
    } else {
      return;
    }
  }

  clearStoryTimers();
  updateModeBadge(false);

  const activeTourLocations = ACTIVE_SALES_LOCATIONS.filter(loc => loc.active !== false);
  if (activeTourLocations.length === 0) return;

  if (storyCounter >= activeTourLocations.length) {
    storyCounter = 0;
    currentIndex = 0;
    showGlobalSummaryScreen();
    return;
  }
  storyCounter++;

  const target = activeTourLocations[currentIndex % activeTourLocations.length];
  if (!target) return;
  currentActiveTargetId = target.id;

  if (target.partImage) {
    const preloader = new Image();
    preloader.src = target.partImage;
  }

  updateArcVisuals();
  world.ringsData(getActiveRingsData());
  world.htmlElementsData([]); 
  world.controls().autoRotate = false;

  const cameraPOV = getStoryCameraPOV(target);
  world.pointOfView(cameraPOV, 2200);

  const timer1 = setTimeout(() => {
    if (isInterrupted) return;
    world.htmlElementsData([target]);
    displayTargetCard(target, 8300);
  }, 1200);
  activeTimers.push(timer1);

  const timer2 = setTimeout(() => {
    if (isInterrupted) return;

    if (card) card.classList.add('opacity-0', 'translate-y-6');
    world.htmlElementsData([]);

    const oldPartImg = document.getElementById('card-part-img');
    if (oldPartImg) {
      oldPartImg.classList.add('opacity-0');
      oldPartImg.src = '';
    }

    currentActiveTargetId = null;
    updateArcVisuals();
    world.ringsData(getActiveRingsData());

    const pullBackAlt = target.country.toLowerCase().includes("türki") ? 1.2 : 2.0;
    world.pointOfView({ lat: target.lat, lng: target.lng + 20, altitude: pullBackAlt }, 2000);
    world.controls().autoRotate = true;

    currentIndex++;
    playNextStory();
  }, 9500);
  activeTimers.push(timer2);
}

// 4. VİDEO ÖNCESİ KÜRESEL VİTRİN (15 SANİYE)
function showGlobalSummaryScreen() {
  clearStoryTimers();
  currentActiveTargetId = null;
  world.ringsData(getActiveRingsData());
  updateArcVisuals();
  if (card) card.classList.add('opacity-0', 'translate-y-6');

  world.controls().autoRotate = true;
  world.controls().autoRotateSpeed = 0.55;
  world.pointOfView({ lat: 28.0, lng: 32.0, altitude: 2.75 }, 2400);

  const summary = document.getElementById('global-summary');
  const timer1 = setTimeout(() => {
    if (isInterrupted) return;
    if (summary) {
      summary.classList.remove('opacity-0', 'pointer-events-none');
      const inner = summary.querySelector('div');
      if (inner) inner.classList.remove('scale-95');
    }
  }, 800);
  activeTimers.push(timer1);

  const timer2 = setTimeout(() => {
    if (isInterrupted) return;
    if (summary) {
      summary.classList.add('opacity-0', 'pointer-events-none');
      const inner = summary.querySelector('div');
      if (inner) inner.classList.add('scale-95');
    }
    playShowreelVideo();
  }, 15500);
  activeTimers.push(timer2);
}

// =================================================================
// 5. SES YÖNETİMİ & PI 5 DONANIM KORUMALI VİDEO MOTORU
// =================================================================
let isUserAudioUnlocked = false;

// Ekrana ilk dokunulduğunda/tıklandığında tarayıcının ses kilidini kaldırır
function unlockKioskAudio() {
  isUserAudioUnlocked = true;
  const video = document.getElementById('kiosk-video');
  if (video) video.muted = false;
  window.removeEventListener('click', unlockKioskAudio);
  window.removeEventListener('touchstart', unlockKioskAudio);
}
window.addEventListener('click', unlockKioskAudio);
window.addEventListener('touchstart', unlockKioskAudio);

function updateAudioButtonUI(isMuted) {
  const icon = document.getElementById('sound-icon');
  const label = document.getElementById('sound-label');
  const btn = document.getElementById('video-sound-btn');
  if (icon && label && btn) {
    if (isMuted) {
      icon.innerText = "🔇";
      label.innerText = "Ses: Kapalı";
      btn.className = "glass-panel px-5 py-3 rounded-2xl flex items-center gap-2 text-xs font-bold text-amber-400 hover:text-white pointer-events-auto transition-all active:scale-95 shadow-lg";
    } else {
      icon.innerText = "🔊";
      label.innerText = "Ses: Açık";
      btn.className = "glass-panel px-5 py-3 rounded-2xl flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-white pointer-events-auto transition-all active:scale-95 shadow-lg";
    }
  }
}

function toggleVideoAudio() {
  const video = document.getElementById('kiosk-video');
  if (!video) return;
  video.muted = !video.muted;
  isUserAudioUnlocked = !video.muted;
  updateAudioButtonUI(video.muted);
}

function playShowreelVideo() {
  clearStoryTimers();
  const overlay = document.getElementById('video-overlay');
  const video = document.getElementById('kiosk-video');
  const globeCanvas = document.getElementById('globeViz');

  if (overlay && video) {
    // Pi 5 GPU Koruması: Video sırasında WebGL arka planı uyut
    if (globeCanvas) globeCanvas.style.visibility = 'hidden';
    world.controls().autoRotate = false;

    overlay.classList.remove('opacity-0', 'pointer-events-none');
    video.currentTime = 0;
    video.volume = 0.85; // %85 ses seviyesi
    video.muted = false; // Sesli başlatmayı dene

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        updateAudioButtonUI(false);
      }).catch(err => {
        console.warn("Otomatik ses kuralı nedeniyle sessiz başlatıldı:", err);
        video.muted = true;
        video.play();
        updateAudioButtonUI(true);
      });
    }

    video.onended = () => {
      closeShowreelVideo();
      if (!isInterrupted) playNextStory();
    };
  }
}

function closeShowreelVideo() {
  const overlay = document.getElementById('video-overlay');
  const video = document.getElementById('kiosk-video');
  const globeCanvas = document.getElementById('globeViz');

  if (overlay && video) {
    video.pause();
    overlay.classList.add('opacity-0', 'pointer-events-none');
    if (globeCanvas) globeCanvas.style.visibility = 'visible';
  }
}

function triggerSaleSimulation(customData = null) {
  isInterrupted = true;
  clearStoryTimers();
  closeShowreelVideo();

  const alertModal = document.getElementById('sale-alert');
  const alertCity = document.getElementById('alert-city');
  const alertDesc = document.getElementById('alert-desc');

  let targetLoc = null;
  if (customData) {
    targetLoc = customData;
    if (alertCity) alertCity.innerText = `${customData.customer} • ${customData.country}`;
    if (alertDesc) alertDesc.innerText = customData.useCase || "Yeni Rownd torna teslimatı yapıldı.";
  } else {
    const unvisited = ACTIVE_SALES_LOCATIONS.filter(l => l.id !== currentActiveTargetId);
    targetLoc = unvisited[Math.floor(Math.random() * unvisited.length)] || ACTIVE_SALES_LOCATIONS[0];
    if (alertCity) alertCity.innerText = `${targetLoc.customer} • ${targetLoc.country}`;
    if (alertDesc) alertDesc.innerText = `${targetLoc.machine} başarıyla devreye alındı.`;
  }

  if (alertModal) {
    alertModal.classList.remove('opacity-0', 'pointer-events-none');
    const inner = alertModal.querySelector('div');
    if (inner) inner.classList.remove('scale-90');
  }

  setTimeout(() => {
    if (alertModal) {
      alertModal.classList.add('opacity-0', 'pointer-events-none');
      const inner = alertModal.querySelector('div');
      if (inner) inner.classList.add('scale-90');
    }

    world.pointOfView({
      lat: targetLoc.lat,
      lng: targetLoc.lng,
      altitude: 0.85
    }, 2000);

    setTimeout(() => {
      isInterrupted = false;
      playNextStory();
    }, 4500);
  }, 4000);
}

// =================================================================
// 6. MQTT MOBİL KUMANDA & YÖNETİM SENKRONİZASYONU
// =================================================================
const urlParams = new URLSearchParams(window.location.search);
const KIOSK_SESSION_ID = urlParams.get('session') || 'kiosk_main';

const MQTT_BROKER = 'wss://broker.emqx.io:8084/mqtt';
const TOPIC_GLOBAL_CONTROL = 'rownd/kiosk/control';
const TOPIC_SESSION_CONTROL = `rownd/kiosk/${KIOSK_SESSION_ID}`;
const TOPIC_STATUS = 'rownd/kiosk/status';
const TOPIC_SYNC = 'rownd/kiosk/admin_sync';

let client = null;
try {
  client = mqtt.connect(MQTT_BROKER, {
    clientId: 'kiosk_screen_' + Math.random().toString(16).substring(2, 8),
    keepalive: 30,
    clean: true
  });

  client.on('connect', () => {
    safeSetText('remote-status', `Oturum: Canlı (${KIOSK_SESSION_ID})`);
    client.subscribe([TOPIC_GLOBAL_CONTROL, TOPIC_SESSION_CONTROL, TOPIC_SYNC]);
    client.publish(TOPIC_STATUS, JSON.stringify({ state: 'ONLINE', session: KIOSK_SESSION_ID, time: Date.now() }));
  });

  client.on('message', (topic, message) => {
    try {
      const data = JSON.parse(message.toString());

      if (topic === TOPIC_SYNC) {
        if (data.action === 'LOCATIONS_SYNC' && Array.isArray(data.locations)) {
          reloadGlobeData(data.locations);
        }
        if (data.newSale) {
          triggerSaleSimulation(data.newSale);
        }
      }

      if (topic === TOPIC_GLOBAL_CONTROL || topic === TOPIC_SESSION_CONTROL || topic === TOPIC_SYNC) {
        if (data.action === 'FOCUS_LOCATION' || data.action === 'RESUME_TOUR' || data.action === 'PLAY_VIDEO' || data.action === 'SHOWREEL' || data.action === 'RESET_VIEW') {
          handleRemoteCommand(data);
        }
      }
    } catch (e) {}
  });
} catch (e) {}

let manualControlTimeout = null;

function handleRemoteCommand(data) {
  clearTimeout(manualControlTimeout);
  isInterrupted = true;
  clearStoryTimers();
  closeShowreelVideo();
  updateModeBadge(true);

  safeSetText('remote-status', `Komut: ${data.action}`);

  if (data.action === 'FOCUS_LOCATION') {
    const target = ACTIVE_SALES_LOCATIONS.find(loc => loc.id === data.targetId);
    if (!target) return;

    if (target.partImage) {
      const preloader = new Image();
      preloader.src = target.partImage;
    }

    const oldPartImg = document.getElementById('card-part-img');
    if (oldPartImg) {
      oldPartImg.classList.add('opacity-0');
      oldPartImg.src = '';
    }

    currentActiveTargetId = target.id;
    updateArcVisuals();
    world.ringsData(getActiveRingsData());
    world.htmlElementsData([]);
    if (card) card.classList.add('opacity-0', 'translate-y-6');

    world.controls().autoRotate = false;
    const cameraPOV = getStoryCameraPOV(target);
    world.pointOfView(cameraPOV, 2000);

    setTimeout(() => {
      world.htmlElementsData([target]);
      displayTargetCard(target, 12800);
    }, 1200);

    manualControlTimeout = setTimeout(() => {
      if (card) card.classList.add('opacity-0', 'translate-y-6');
      world.htmlElementsData([]);
      isInterrupted = false;
      playNextStory();
    }, 14000);
  }
  else if (data.action === 'RESUME_TOUR') {
    if (card) card.classList.add('opacity-0', 'translate-y-6');
    world.htmlElementsData([]);
    isInterrupted = false;
    playNextStory();
  }
  else if (data.action === 'PLAY_VIDEO' || data.action === 'SHOWREEL') {
    playShowreelVideo();
  }
  else if (data.action === 'RESET_VIEW') {
    currentActiveTargetId = null;
    updateArcVisuals();
    world.pointOfView({ lat: 40.1885, lng: 29.0610, altitude: 2.2 }, 2000);
    setTimeout(() => {
      isInterrupted = false;
      playNextStory();
    }, 3000);
  }
}

window.addEventListener('storage', (e) => {
  if (e.key === 'rownd_custom_locations') {
    try {
      const parsed = JSON.parse(e.newValue);
      if (Array.isArray(parsed)) reloadGlobeData(parsed);
    } catch(err) {}
  }
});

let mouseHideTimeout = null;
window.addEventListener('mousemove', () => {
  document.body.classList.remove('hide-cursor');
  clearTimeout(mouseHideTimeout);
  mouseHideTimeout = setTimeout(() => {
    document.body.classList.add('hide-cursor');
  }, 3500);
});

// =================================================================
// 7. BÜYÜTÜLMÜŞ (96px) ASLA ÇÖKMEYEN QR MOTORU
// =================================================================
function renderKioskQRCode() {
  const qrBox = document.getElementById('qrcode');
  if (!qrBox) return;
  qrBox.innerHTML = '';

  const currentUrl = window.location.href.split('?')[0];
  const basePath = currentUrl.substring(0, currentUrl.lastIndexOf('/'));
  const remoteUrl = `${basePath}/remote.html?session=${encodeURIComponent(KIOSK_SESSION_ID)}`;

  let rendered = false;
  try {
    if (typeof QRCode !== 'undefined') {
      new QRCode(qrBox, {
        text: remoteUrl,
        width: 96,
        height: 96,
        colorDark: "#030712",
        colorLight: "#ffffff",
        correctLevel: (typeof QRCode.CorrectLevel !== 'undefined' && QRCode.CorrectLevel.M) ? QRCode.CorrectLevel.M : 0
      });
      rendered = true;
    }
  } catch (e) {
    console.warn('QRCode JS kütüphanesi devre dışı, görsel motoru devrede...');
  }

  if (!rendered) {
    qrBox.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=96x96&data=${encodeURIComponent(remoteUrl)}&color=030712&bgcolor=ffffff" width="96" height="96" class="rounded-lg shadow-sm" alt="QR" />`;
  }
}

try {
  renderKioskQRCode();
} catch (e) {}

window.addEventListener('resize', () => {
  world.width(window.innerWidth);
  world.height(window.innerHeight);
});

// 5 SANİYE GECİKMELİ TUR BAŞLATICI
function startKioskTourSafely() {
  console.log("Rownd Precision Kiosk Turu 5 sn sonra başlatıldı...");
  playNextStory();
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(startKioskTourSafely, 5000);
} else {
  window.addEventListener('DOMContentLoaded', () => setTimeout(startKioskTourSafely, 5000));
}