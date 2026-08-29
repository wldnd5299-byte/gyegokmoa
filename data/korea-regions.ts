export interface KoreaRegion {
  province: string;
  aliases: string[];
  center: { latitude: number; longitude: number };
  cities: {
    name: string;
    aliases?: string[];
    center: { latitude: number; longitude: number };
  }[];
}

/*
 * 지도 검색용 전국 시·도 / 시·군·구 데이터.
 * 좌표는 지역 검색 후 지도를 이동시키기 위한 대표 중심점입니다.
 */
export const KOREA_REGIONS: KoreaRegion[] = [
  {
    province: "서울특별시",
    aliases: ["서울"],
    center: { latitude: 37.5665, longitude: 126.9780 },
    cities: [
      ["종로구",37.5735,126.9790],["중구",37.5641,126.9979],["용산구",37.5326,126.9900],
      ["성동구",37.5633,127.0371],["광진구",37.5385,127.0823],["동대문구",37.5744,127.0396],
      ["중랑구",37.6063,127.0927],["성북구",37.5894,127.0167],["강북구",37.6396,127.0257],
      ["도봉구",37.6688,127.0471],["노원구",37.6542,127.0568],["은평구",37.6027,126.9291],
      ["서대문구",37.5791,126.9368],["마포구",37.5663,126.9019],["양천구",37.5170,126.8665],
      ["강서구",37.5509,126.8495],["구로구",37.4955,126.8874],["금천구",37.4569,126.8955],
      ["영등포구",37.5264,126.8963],["동작구",37.5124,126.9393],["관악구",37.4784,126.9516],
      ["서초구",37.4837,127.0324],["강남구",37.5172,127.0473],["송파구",37.5145,127.1059],
      ["강동구",37.5301,127.1238],
    ].map(([name,latitude,longitude]) => ({name:name as string,center:{latitude:latitude as number,longitude:longitude as number}})),
  },
  {
    province: "부산광역시", aliases:["부산"], center:{latitude:35.1796,longitude:129.0756},
    cities: ["중구","서구","동구","영도구","부산진구","동래구","남구","북구","해운대구","사하구","금정구","강서구","연제구","수영구","사상구","기장군"].map(name=>({name,center:{latitude:35.1796,longitude:129.0756}})),
  },
  {
    province:"대구광역시", aliases:["대구"], center:{latitude:35.8714,longitude:128.6014},
    cities:["중구","동구","서구","남구","북구","수성구","달서구","달성군","군위군"].map(name=>({name,center:{latitude:35.8714,longitude:128.6014}})),
  },
  {
    province:"인천광역시", aliases:["인천"], center:{latitude:37.4563,longitude:126.7052},
    cities:["중구","동구","미추홀구","연수구","남동구","부평구","계양구","서구","강화군","옹진군"].map(name=>({name,center:{latitude:37.4563,longitude:126.7052}})),
  },
  {
    province:"광주광역시", aliases:["광주"], center:{latitude:35.1595,longitude:126.8526},
    cities:["동구","서구","남구","북구","광산구"].map(name=>({name,center:{latitude:35.1595,longitude:126.8526}})),
  },
  {
    province:"대전광역시", aliases:["대전"], center:{latitude:36.3504,longitude:127.3845},
    cities:["동구","중구","서구","유성구","대덕구"].map(name=>({name,center:{latitude:36.3504,longitude:127.3845}})),
  },
  {
    province:"울산광역시", aliases:["울산"], center:{latitude:35.5384,longitude:129.3114},
    cities:["중구","남구","동구","북구","울주군"].map(name=>({name,center:{latitude:35.5384,longitude:129.3114}})),
  },
  {
    province:"세종특별자치시", aliases:["세종"], center:{latitude:36.4800,longitude:127.2890},
    cities:[],
  },
  {
    province:"경기도", aliases:["경기"], center:{latitude:37.4138,longitude:127.5183},
    cities:["수원시","용인시","고양시","화성시","성남시","부천시","남양주시","안산시","평택시","안양시","시흥시","파주시","김포시","의정부시","광주시","하남시","광명시","군포시","양주시","오산시","이천시","안성시","구리시","의왕시","포천시","양평군","여주시","동두천시","과천시","가평군","연천군"].map(name=>({name,center:{latitude:37.4138,longitude:127.5183}})),
  },
  {
    province:"강원특별자치도", aliases:["강원","강원도"], center:{latitude:37.8228,longitude:128.1555},
    cities:["춘천시","원주시","강릉시","동해시","태백시","속초시","삼척시","홍천군","횡성군","영월군","평창군","정선군","철원군","화천군","양구군","인제군","고성군","양양군"].map(name=>({name,center:{latitude:37.8228,longitude:128.1555}})),
  },
  {
    province:"충청북도", aliases:["충북"], center:{latitude:36.6357,longitude:127.4917},
    cities:["청주시","충주시","제천시","보은군","옥천군","영동군","증평군","진천군","괴산군","음성군","단양군"].map(name=>({name,center:{latitude:36.6357,longitude:127.4917}})),
  },
  {
    province:"충청남도", aliases:["충남"], center:{latitude:36.6588,longitude:126.6728},
    cities:["천안시","공주시","보령시","아산시","서산시","논산시","계룡시","당진시","금산군","부여군","서천군","청양군","홍성군","예산군","태안군"].map(name=>({name,center:{latitude:36.6588,longitude:126.6728}})),
  },
  {
    province:"전북특별자치도", aliases:["전북","전라북도"], center:{latitude:35.7175,longitude:127.1530},
    cities:["전주시","군산시","익산시","정읍시","남원시","김제시","완주군","진안군","무주군","장수군","임실군","순창군","고창군","부안군"].map(name=>({name,center:{latitude:35.7175,longitude:127.1530}})),
  },
  {
    province:"전라남도", aliases:["전남"], center:{latitude:34.8679,longitude:126.9910},
    cities:["목포시","여수시","순천시","나주시","광양시","담양군","곡성군","구례군","고흥군","보성군","화순군","장흥군","강진군","해남군","영암군","무안군","함평군","영광군","장성군","완도군","진도군","신안군"].map(name=>({name,center:{latitude:34.8679,longitude:126.9910}})),
  },
  {
    province:"경상북도", aliases:["경북"], center:{latitude:36.4919,longitude:128.8889},
    cities:["포항시","경주시","김천시","안동시","구미시","영주시","영천시","상주시","문경시","경산시","의성군","청송군","영양군","영덕군","청도군","고령군","성주군","칠곡군","예천군","봉화군","울진군","울릉군"].map(name=>({name,center:{latitude:36.4919,longitude:128.8889}})),
  },
  {
    province:"경상남도", aliases:["경남"], center:{latitude:35.4606,longitude:128.2132},
    cities:["창원시","진주시","통영시","사천시","김해시","밀양시","거제시","양산시","의령군","함안군","창녕군","고성군","남해군","하동군","산청군","함양군","거창군","합천군"].map(name=>({name,center:{latitude:35.4606,longitude:128.2132}})),
  },
  {
    province:"제주특별자치도", aliases:["제주","제주도"], center:{latitude:33.4996,longitude:126.5312},
    cities:["제주시","서귀포시"].map(name=>({name,center:{latitude:33.4996,longitude:126.5312}})),
  },
];

export interface RegionSearchItem {
  key: string;
  label: string;
  province: string;
  city?: string;
  aliases: string[];
  latitude: number;
  longitude: number;
  level: number;
}

export const REGION_SEARCH_ITEMS: RegionSearchItem[] =
  KOREA_REGIONS.flatMap((region) => {
    const provinceItem: RegionSearchItem = {
      key: `province-${region.province}`,
      label: region.province,
      province: region.province,
      aliases: [region.province, ...region.aliases],
      latitude: region.center.latitude,
      longitude: region.center.longitude,
      level: 11,
    };

    const cityItems = region.cities.map((city) => ({
      key: `city-${region.province}-${city.name}`,
      label: `${region.province} ${city.name}`,
      province: region.province,
      city: city.name,
      aliases: [
        city.name,
        `${region.province} ${city.name}`,
        ...region.aliases.map(alias => `${alias} ${city.name}`),
        ...(city.aliases || []),
      ],
      latitude: city.center.latitude,
      longitude: city.center.longitude,
      level: 7,
    }));

    return [provinceItem, ...cityItems];
  });
