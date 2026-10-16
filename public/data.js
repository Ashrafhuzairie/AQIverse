// All environmental values below are invented for this interactive concept.
// Coordinates describe city centres; the readings are not IQAir observations.
const rows = [
  ['singapore','Singapore','Singapore','SG','Asia',1.3521,103.8198,42,29,78,'singapore'],
  ['johor-bahru','Johor Bahru','Malaysia','MY','Asia',1.4927,103.7414,46,30,79,'malaysia/johor/johor-bahru'],
  ['kuala-lumpur','Kuala Lumpur','Malaysia','MY','Asia',3.139,101.6869,59,30,76,'malaysia/kuala-lumpur'],
  ['jakarta','Jakarta','Indonesia','ID','Asia',-6.2088,106.8456,128,31,72,'indonesia/jakarta'],
  ['bangkok','Bangkok','Thailand','TH','Asia',13.7563,100.5018,86,32,68,'thailand/bangkok'],
  ['hanoi','Hanoi','Vietnam','VN','Asia',21.0278,105.8342,119,27,75,'vietnam/hanoi'],
  ['manila','Manila','Philippines','PH','Asia',14.5995,120.9842,71,30,74,'philippines/ncr/manila'],
  ['tokyo','Tokyo','Japan','JP','Asia',35.6762,139.6503,34,21,61,'japan/tokyo'],
  ['seoul','Seoul','South Korea','KR','Asia',37.5665,126.978,57,18,56,'south-korea/seoul'],
  ['beijing','Beijing','China','CN','Asia',39.9042,116.4074,112,19,46,'china/beijing'],
  ['shanghai','Shanghai','China','CN','Asia',31.2304,121.4737,83,23,65,'china/shanghai'],
  ['delhi','Delhi','India','IN','Asia',28.6139,77.209,178,31,42,'india/delhi'],
  ['mumbai','Mumbai','India','IN','Asia',19.076,72.8777,108,30,73,'india/maharashtra/mumbai'],
  ['dhaka','Dhaka','Bangladesh','BD','Asia',23.8103,90.4125,163,29,77,'bangladesh/dhaka'],
  ['lahore','Lahore','Pakistan','PK','Asia',31.5204,74.3587,224,30,48,'pakistan/punjab/lahore'],
  ['kathmandu','Kathmandu','Nepal','NP','Asia',27.7172,85.324,136,22,63,'nepal/central/kathmandu'],
  ['dubai','Dubai','United Arab Emirates','AE','Asia',25.2048,55.2708,94,34,50,'united-arab-emirates/dubai'],
  ['riyadh','Riyadh','Saudi Arabia','SA','Asia',24.7136,46.6753,103,33,27,'saudi-arabia/ar-riyad/riyadh'],
  ['istanbul','Istanbul','Türkiye','TR','Europe',41.0082,28.9784,67,21,67,'turkey/istanbul'],
  ['london','London','United Kingdom','GB','Europe',51.5074,-0.1278,28,16,71,'uk/england/london'],
  ['paris','Paris','France','FR','Europe',48.8566,2.3522,38,17,65,'france/ile-de-france/paris'],
  ['berlin','Berlin','Germany','DE','Europe',52.52,13.405,31,14,64,'germany/berlin'],
  ['rome','Rome','Italy','IT','Europe',41.9028,12.4964,54,23,59,'italy/latium/rome'],
  ['madrid','Madrid','Spain','ES','Europe',40.4168,-3.7038,33,23,43,'spain/madrid'],
  ['oslo','Oslo','Norway','NO','Europe',59.9139,10.7522,18,10,64,'norway/oslo'],
  ['zurich','Zurich','Switzerland','CH','Europe',47.3769,8.5417,22,15,67,'switzerland/zurich'],
  ['helsinki','Helsinki','Finland','FI','Europe',60.1699,24.9384,15,9,69,'finland/uusimaa/helsinki'],
  ['new-york','New York','United States','US','Americas',40.7128,-74.006,47,20,62,'usa/new-york/new-york-city'],
  ['los-angeles','Los Angeles','United States','US','Americas',34.0522,-118.2437,65,25,48,'usa/california/los-angeles'],
  ['toronto','Toronto','Canada','CA','Americas',43.6532,-79.3832,29,15,63,'canada/ontario/toronto'],
  ['mexico-city','Mexico City','Mexico','MX','Americas',19.4326,-99.1332,105,22,56,'mexico/mexico-city'],
  ['sao-paulo','São Paulo','Brazil','BR','Americas',-23.5505,-46.6333,73,26,68,'brazil/sao-paulo'],
  ['santiago','Santiago','Chile','CL','Americas',-33.4489,-70.6693,61,20,51,'chile/santiago'],
  ['cairo','Cairo','Egypt','EG','Africa',30.0444,31.2357,117,29,38,'egypt/cairo'],
  ['lagos','Lagos','Nigeria','NG','Africa',6.5244,3.3792,138,29,80,'nigeria/lagos'],
  ['nairobi','Nairobi','Kenya','KE','Africa',-1.2921,36.8219,53,24,57,'kenya/nairobi'],
  ['cape-town','Cape Town','South Africa','ZA','Africa',-33.9249,18.4241,25,20,62,'south-africa/western-cape/cape-town'],
  ['sydney','Sydney','Australia','AU','Oceania',-33.8688,151.2093,19,22,62,'australia/new-south-wales/sydney'],
  ['melbourne','Melbourne','Australia','AU','Oceania',-37.8136,144.9631,23,18,64,'australia/victoria/melbourne'],
  ['auckland','Auckland','New Zealand','NZ','Oceania',-36.8485,174.7633,12,18,72,'new-zealand/auckland'],
  ['ulaanbaatar','Ulaanbaatar','Mongolia','MN','Asia',47.9184,106.9177,313,7,43,'mongolia/ulaanbaatar']
];
const subdivisions={
 singapore:'Singapore','johor-bahru':'Johor','kuala-lumpur':'Kuala Lumpur',jakarta:'Jakarta',bangkok:'Bangkok',hanoi:'Hanoi',manila:'Metro Manila',tokyo:'Tokyo',seoul:'Seoul',beijing:'Beijing',shanghai:'Shanghai',delhi:'Delhi',mumbai:'Maharashtra',dhaka:'Dhaka',lahore:'Punjab',kathmandu:'Bagmati',dubai:'Dubai',riyadh:'Riyadh',istanbul:'Istanbul',london:'England',paris:'Île-de-France',berlin:'Berlin',rome:'Lazio',madrid:'Community of Madrid',oslo:'Oslo',zurich:'Zürich',helsinki:'Uusimaa','new-york':'New York','los-angeles':'California',toronto:'Ontario','mexico-city':'Mexico City','sao-paulo':'São Paulo',santiago:'Santiago Metropolitan',cairo:'Cairo',lagos:'Lagos',nairobi:'Nairobi','cape-town':'Western Cape',sydney:'New South Wales',melbourne:'Victoria',auckland:'Auckland',ulaanbaatar:'Ulaanbaatar'
};
rows.forEach(row=>row.push(subdivisions[row[0]]||''));
rows.push(
 ['george-town','George Town','Malaysia','MY','Asia',5.4141,100.3288,52,30,76,'malaysia/penang/george-town','Penang'],
 ['kuching','Kuching','Malaysia','MY','Asia',1.5535,110.3593,39,30,82,'malaysia/sarawak/kuching','Sarawak'],
 ['kangar','Kangar','Malaysia','MY','Asia',6.4414,100.1986,39,31,76,'malaysia/perlis/kangar','Perlis'],
 ['alor-setar','Alor Setar','Malaysia','MY','Asia',6.1248,100.3678,44,31,77,'malaysia/kedah/alor-setar','Kedah'],
 ['ipoh','Ipoh','Malaysia','MY','Asia',4.5975,101.0901,55,31,75,'malaysia/perak/ipoh','Perak'],
 ['shah-alam','Shah Alam','Malaysia','MY','Asia',3.0738,101.5183,61,31,73,'malaysia/selangor/shah-alam','Selangor'],
 ['petaling-jaya','Petaling Jaya','Malaysia','MY','Asia',3.1073,101.6067,64,31,74,'malaysia/selangor/petaling-jaya','Selangor'],
 ['putrajaya','Putrajaya','Malaysia','MY','Asia',2.9264,101.6964,48,31,72,'malaysia/putrajaya/putrajaya','Putrajaya'],
 ['seremban','Seremban','Malaysia','MY','Asia',2.7258,101.9424,51,31,75,'malaysia/negeri-sembilan/seremban','Negeri Sembilan'],
 ['malacca-city','Malacca City','Malaysia','MY','Asia',2.1896,102.2501,49,31,77,'malaysia/melaka/malacca-city','Melaka'],
 ['kuantan','Kuantan','Malaysia','MY','Asia',3.8077,103.326,46,30,80,'malaysia/pahang/kuantan','Pahang'],
 ['kuala-terengganu','Kuala Terengganu','Malaysia','MY','Asia',5.3296,103.137,41,30,82,'malaysia/terengganu/kuala-terengganu','Terengganu'],
 ['kota-bharu','Kota Bharu','Malaysia','MY','Asia',6.1254,102.2381,43,31,79,'malaysia/kelantan/kota-bharu','Kelantan'],
 ['kota-kinabalu','Kota Kinabalu','Malaysia','MY','Asia',5.9804,116.0735,37,30,80,'malaysia/sabah/kota-kinabalu','Sabah'],
 ['miri','Miri','Malaysia','MY','Asia',4.3995,113.9914,40,30,81,'malaysia/sarawak/miri','Sarawak'],
 ['muar','Muar','Malaysia','MY','Asia',2.0442,102.5689,53,31,77,'malaysia/johor/muar','Johor'],
 ['bukit-timah','Bukit Timah','Singapore','SG','Asia',1.3294,103.8021,38,30,77,'singapore/singapore/singapore','Singapore'],
 ['changi','Changi','Singapore','SG','Asia',1.3644,103.9915,35,30,78,'singapore/singapore/singapore','Singapore'],
 ['woodlands','Woodlands','Singapore','SG','Asia',1.4382,103.789,44,30,79,'singapore/singapore/singapore','Singapore'],
 ['jurong-west','Jurong West','Singapore','SG','Asia',1.3404,103.709,46,30,78,'singapore/singapore/singapore','Singapore'],
 ['tampines','Tampines','Singapore','SG','Asia',1.3496,103.9568,39,30,78,'singapore/singapore/singapore','Singapore'],
 ['punggol','Punggol','Singapore','SG','Asia',1.4051,103.9023,41,30,79,'singapore/singapore/singapore','Singapore'],
 ['toa-payoh','Toa Payoh','Singapore','SG','Asia',1.3343,103.8563,43,30,77,'singapore/singapore/singapore','Singapore'],
 ['clementi','Clementi','Singapore','SG','Asia',1.3162,103.7649,40,30,78,'singapore/singapore/singapore','Singapore'],
 ['orchard','Orchard','Singapore','SG','Asia',1.3048,103.8318,45,30,77,'singapore/singapore/singapore','Singapore'],
 ['queenstown','Queenstown','Singapore','SG','Asia',1.2942,103.7861,42,30,78,'singapore/singapore/singapore','Singapore'],
 ['ang-mo-kio','Ang Mo Kio','Singapore','SG','Asia',1.3691,103.8454,40,30,79,'singapore/singapore/singapore','Singapore'],
 ['surabaya','Surabaya','Indonesia','ID','Asia',-7.2575,112.7521,96,31,70,'indonesia/east-java/surabaya','East Java'],
 ['ho-chi-minh-city','Ho Chi Minh City','Vietnam','VN','Asia',10.8231,106.6297,82,31,73,'vietnam/ho-chi-minh-city','Ho Chi Minh City'],
 ['taipei','Taipei','Taiwan','TW','Asia',25.033,121.5654,48,25,72,'taiwan/taipei','Taipei'],
 ['hong-kong','Hong Kong','China','HK','Asia',22.3193,114.1694,61,27,76,'china/hong-kong','Hong Kong'],
 ['osaka','Osaka','Japan','JP','Asia',34.6937,135.5023,42,22,64,'japan/osaka','Osaka'],
 ['bengaluru','Bengaluru','India','IN','Asia',12.9716,77.5946,91,27,58,'india/karnataka/bengaluru','Karnataka'],
 ['chennai','Chennai','India','IN','Asia',13.0827,80.2707,104,31,70,'india/tamil-nadu/chennai','Tamil Nadu'],
 ['kolkata','Kolkata','India','IN','Asia',22.5726,88.3639,144,30,72,'india/west-bengal/kolkata','West Bengal'],
 ['karachi','Karachi','Pakistan','PK','Asia',24.8607,67.0011,153,31,65,'pakistan/sindh/karachi','Sindh'],
 ['doha','Doha','Qatar','QA','Asia',25.2854,51.531,87,33,49,'qatar/doha','Doha'],
 ['abu-dhabi','Abu Dhabi','United Arab Emirates','AE','Asia',24.4539,54.3773,78,34,51,'united-arab-emirates/abu-dhabi','Abu Dhabi'],
 ['amsterdam','Amsterdam','Netherlands','NL','Europe',52.3676,4.9041,27,15,73,'netherlands/north-holland/amsterdam','North Holland'],
 ['brussels','Brussels','Belgium','BE','Europe',50.8503,4.3517,35,15,72,'belgium/brussels-capital/brussels','Brussels-Capital'],
 ['vienna','Vienna','Austria','AT','Europe',48.2082,16.3738,30,16,66,'austria/vienna','Vienna'],
 ['prague','Prague','Czechia','CZ','Europe',50.0755,14.4378,38,15,65,'czech-republic/prague','Prague'],
 ['warsaw','Warsaw','Poland','PL','Europe',52.2297,21.0122,45,14,67,'poland/masovian-voivodeship/warsaw','Masovian'],
 ['lisbon','Lisbon','Portugal','PT','Europe',38.7223,-9.1393,32,21,65,'portugal/lisbon','Lisbon'],
 ['athens','Athens','Greece','GR','Europe',37.9838,23.7275,56,24,54,'greece/attica/athens','Attica'],
 ['stockholm','Stockholm','Sweden','SE','Europe',59.3293,18.0686,17,11,68,'sweden/stockholm','Stockholm'],
 ['chicago','Chicago','United States','US','Americas',41.8781,-87.6298,52,18,61,'usa/illinois/chicago','Illinois'],
 ['houston','Houston','United States','US','Americas',29.7604,-95.3698,62,27,72,'usa/texas/houston','Texas'],
 ['vancouver','Vancouver','Canada','CA','Americas',49.2827,-123.1207,24,14,72,'canada/british-columbia/vancouver','British Columbia'],
 ['montreal','Montréal','Canada','CA','Americas',45.5019,-73.5674,31,15,66,'canada/quebec/montreal','Quebec'],
 ['bogota','Bogotá','Colombia','CO','Americas',4.711,-74.0721,68,19,76,'colombia/bogota-dc/bogota','Bogotá D.C.'],
 ['lima','Lima','Peru','PE','Americas',-12.0464,-77.0428,84,22,78,'peru/lima/lima','Lima'],
 ['buenos-aires','Buenos Aires','Argentina','AR','Americas',-34.6037,-58.3816,41,22,67,'argentina/buenos-aires','Buenos Aires'],
 ['rio-de-janeiro','Rio de Janeiro','Brazil','BR','Americas',-22.9068,-43.1729,55,27,73,'brazil/rio-de-janeiro','Rio de Janeiro'],
 ['johannesburg','Johannesburg','South Africa','ZA','Africa',-26.2041,28.0473,72,20,49,'south-africa/gauteng/johannesburg','Gauteng'],
 ['accra','Accra','Ghana','GH','Africa',5.6037,-0.187,96,29,81,'ghana/greater-accra/accra','Greater Accra'],
 ['addis-ababa','Addis Ababa','Ethiopia','ET','Africa',8.9806,38.7578,89,20,58,'ethiopia/addis-ababa','Addis Ababa'],
 ['casablanca','Casablanca','Morocco','MA','Africa',33.5731,-7.5898,69,23,70,'morocco/casablanca-settat/casablanca','Casablanca-Settat'],
 ['brisbane','Brisbane','Australia','AU','Oceania',-27.4698,153.0251,21,24,66,'australia/queensland/brisbane','Queensland'],
 ['perth','Perth','Australia','AU','Oceania',-31.9523,115.8613,18,24,56,'australia/western-australia/perth','Western Australia'],
 ['wellington','Wellington','New Zealand','NZ','Oceania',-41.2866,174.7756,14,16,75,'new-zealand/wellington','Wellington'],
 ['bandung','Bandung','Indonesia','ID','Asia',-6.9175,107.6191,91,27,78,'indonesia/west-java/bandung','West Java'],
 ['medan','Medan','Indonesia','ID','Asia',3.5952,98.6722,88,30,79,'indonesia/north-sumatra/medan','North Sumatra'],
 ['makassar','Makassar','Indonesia','ID','Asia',-5.1477,119.4327,76,31,75,'indonesia/south-sulawesi/makassar','South Sulawesi'],
 ['chiang-mai','Chiang Mai','Thailand','TH','Asia',18.7883,98.9853,97,29,64,'thailand/chiang-mai/chiang-mai','Chiang Mai'],
 ['phuket','Phuket','Thailand','TH','Asia',7.8804,98.3923,54,30,78,'thailand/phuket/phuket','Phuket'],
 ['da-nang','Da Nang','Vietnam','VN','Asia',16.0544,108.2022,68,30,77,'vietnam/da-nang','Da Nang'],
 ['cebu-city','Cebu City','Philippines','PH','Asia',10.3157,123.8854,65,30,76,'philippines/central-visayas/cebu-city','Central Visayas'],
 ['davao-city','Davao City','Philippines','PH','Asia',7.1907,125.4553,59,30,79,'philippines/davao/davao-city','Davao'],
 ['kyoto','Kyoto','Japan','JP','Asia',35.0116,135.7681,39,21,64,'japan/kyoto/kyoto','Kyoto'],
 ['nagoya','Nagoya','Japan','JP','Asia',35.1815,136.9066,43,22,62,'japan/aichi/nagoya','Aichi'],
 ['sapporo','Sapporo','Japan','JP','Asia',43.0618,141.3545,28,14,68,'japan/hokkaido/sapporo','Hokkaido'],
 ['busan','Busan','South Korea','KR','Asia',35.1796,129.0756,51,20,64,'south-korea/busan','Busan'],
 ['incheon','Incheon','South Korea','KR','Asia',37.4563,126.7052,62,18,58,'south-korea/incheon','Incheon'],
 ['guangzhou','Guangzhou','China','CN','Asia',23.1291,113.2644,96,26,70,'china/guangdong/guangzhou','Guangdong'],
 ['shenzhen','Shenzhen','China','CN','Asia',22.5431,114.0579,84,27,73,'china/guangdong/shenzhen','Guangdong'],
 ['chengdu','Chengdu','China','CN','Asia',30.5728,104.0668,121,20,69,'china/sichuan/chengdu','Sichuan'],
 ['wuhan','Wuhan','China','CN','Asia',30.5928,114.3055,109,22,67,'china/hubei/wuhan','Hubei'],
 ['hyderabad','Hyderabad','India','IN','Asia',17.385,78.4867,112,30,52,'india/telangana/hyderabad','Telangana'],
 ['ahmedabad','Ahmedabad','India','IN','Asia',23.0225,72.5714,133,32,42,'india/gujarat/ahmedabad','Gujarat'],
 ['pune','Pune','India','IN','Asia',18.5204,73.8567,94,28,55,'india/maharashtra/pune','Maharashtra'],
 ['jaipur','Jaipur','India','IN','Asia',26.9124,75.7873,126,31,39,'india/rajasthan/jaipur','Rajasthan'],
 ['islamabad','Islamabad','Pakistan','PK','Asia',33.6844,73.0479,118,27,49,'pakistan/islamabad/islamabad','Islamabad'],
 ['peshawar','Peshawar','Pakistan','PK','Asia',34.0151,71.5249,146,29,45,'pakistan/khyber-pakhtunkhwa/peshawar','Khyber Pakhtunkhwa'],
 ['sharjah','Sharjah','United Arab Emirates','AE','Asia',25.3463,55.4209,89,34,53,'united-arab-emirates/sharjah','Sharjah'],
 ['ankara','Ankara','Türkiye','TR','Europe',39.9334,32.8597,58,19,48,'turkey/ankara','Ankara'],
 ['izmir','Izmir','Türkiye','TR','Europe',38.4237,27.1428,49,23,60,'turkey/izmir','Izmir'],
 ['manchester','Manchester','United Kingdom','GB','Europe',53.4808,-2.2426,32,15,74,'uk/england/manchester','England'],
 ['birmingham','Birmingham','United Kingdom','GB','Europe',52.4862,-1.8904,35,15,72,'uk/england/birmingham','England'],
 ['edinburgh','Edinburgh','United Kingdom','GB','Europe',55.9533,-3.1883,24,13,76,'uk/scotland/edinburgh','Scotland'],
 ['lyon','Lyon','France','FR','Europe',45.764,4.8357,42,18,64,'france/auvergne-rhone-alpes/lyon','Auvergne-Rhône-Alpes'],
 ['marseille','Marseille','France','FR','Europe',43.2965,5.3698,51,22,61,'france/provence-alpes-cote-dazur/marseille','Provence-Alpes-Côte d’Azur'],
 ['munich','Munich','Germany','DE','Europe',48.1351,11.582,29,15,66,'germany/bavaria/munich','Bavaria'],
 ['hamburg','Hamburg','Germany','DE','Europe',53.5511,9.9937,34,14,72,'germany/hamburg','Hamburg'],
 ['milan','Milan','Italy','IT','Europe',45.4642,9.19,69,20,63,'italy/lombardy/milan','Lombardy'],
 ['naples','Naples','Italy','IT','Europe',40.8518,14.2681,57,23,65,'italy/campania/naples','Campania'],
 ['barcelona','Barcelona','Spain','ES','Europe',41.3874,2.1686,46,22,64,'spain/catalonia/barcelona','Catalonia'],
 ['valencia','Valencia','Spain','ES','Europe',39.4699,-0.3763,39,23,62,'spain/valencia/valencia','Valencia'],
 ['san-francisco','San Francisco','United States','US','Americas',37.7749,-122.4194,38,18,69,'usa/california/san-francisco','California'],
 ['seattle','Seattle','United States','US','Americas',47.6062,-122.3321,31,15,72,'usa/washington/seattle','Washington'],
 ['miami','Miami','United States','US','Americas',25.7617,-80.1918,44,29,75,'usa/florida/miami','Florida'],
 ['boston','Boston','United States','US','Americas',42.3601,-71.0589,36,17,66,'usa/massachusetts/boston','Massachusetts'],
 ['dallas','Dallas','United States','US','Americas',32.7767,-96.797,58,27,56,'usa/texas/dallas','Texas'],
 ['washington-dc','Washington, D.C.','United States','US','Americas',38.9072,-77.0369,41,21,64,'usa/washington-d-c/washington-d-c','District of Columbia'],
 ['calgary','Calgary','Canada','CA','Americas',51.0447,-114.0719,27,12,57,'canada/alberta/calgary','Alberta'],
 ['ottawa','Ottawa','Canada','CA','Americas',45.4215,-75.6972,26,15,65,'canada/ontario/ottawa','Ontario'],
 ['edmonton','Edmonton','Canada','CA','Americas',53.5461,-113.4938,30,11,60,'canada/alberta/edmonton','Alberta'],
 ['guadalajara','Guadalajara','Mexico','MX','Americas',20.6597,-103.3496,92,25,51,'mexico/jalisco/guadalajara','Jalisco'],
 ['monterrey','Monterrey','Mexico','MX','Americas',25.6866,-100.3161,101,27,49,'mexico/nuevo-leon/monterrey','Nuevo León'],
 ['brasilia','Brasília','Brazil','BR','Americas',-15.7939,-47.8828,48,27,55,'brazil/federal-district/brasilia','Federal District'],
 ['belo-horizonte','Belo Horizonte','Brazil','BR','Americas',-19.9167,-43.9345,61,26,62,'brazil/minas-gerais/belo-horizonte','Minas Gerais'],
 ['curitiba','Curitiba','Brazil','BR','Americas',-25.4284,-49.2733,42,22,69,'brazil/parana/curitiba','Paraná'],
 ['durban','Durban','South Africa','ZA','Africa',-29.8587,31.0218,44,25,72,'south-africa/kwazulu-natal/durban','KwaZulu-Natal'],
 ['pretoria','Pretoria','South Africa','ZA','Africa',-25.7479,28.2293,66,22,48,'south-africa/gauteng/pretoria','Gauteng'],
 ['mombasa','Mombasa','Kenya','KE','Africa',-4.0435,39.6682,57,29,76,'kenya/mombasa/mombasa','Mombasa'],
 ['alexandria','Alexandria','Egypt','EG','Africa',31.2001,29.9187,83,26,66,'egypt/alexandria','Alexandria'],
 ['abuja','Abuja','Nigeria','NG','Africa',9.0765,7.3986,104,28,67,'nigeria/federal-capital-territory/abuja','Federal Capital Territory'],
 ['rabat','Rabat','Morocco','MA','Africa',34.0209,-6.8416,52,22,68,'morocco/rabat-sale-kenitra/rabat','Rabat-Salé-Kénitra'],
 ['adelaide','Adelaide','Australia','AU','Oceania',-34.9285,138.6007,20,21,58,'australia/south-australia/adelaide','South Australia'],
 ['canberra','Canberra','Australia','AU','Oceania',-35.2809,149.13,16,18,61,'australia/australian-capital-territory/canberra','Australian Capital Territory'],
 ['darwin','Darwin','Australia','AU','Oceania',-12.4634,130.8456,25,31,71,'australia/northern-territory/darwin','Northern Territory'],
 ['christchurch','Christchurch','New Zealand','NZ','Oceania',-43.5321,172.6362,13,16,70,'new-zealand/canterbury/christchurch','Canterbury']
);
export const cities=rows.map((r,index)=>({id:r[0],name:r[1],country:r[2],code:r[3],region:r[4],lat:r[5],lon:r[6],baseAqi:r[7],baseTemp:r[8],baseHumidity:r[9],iqairPath:r[10],subdivision:r[11],index}));
export const categories=[
 {max:50,label:'Good',color:'#54e89b'},
 {max:100,label:'Moderate',color:'#ffd76d'},
 {max:150,label:'Unhealthy for sensitive groups',color:'#ffa45c'},
 {max:200,label:'Unhealthy',color:'#ff718c'},
 {max:300,label:'Very unhealthy',color:'#ba9aff'},
 {max:Infinity,label:'Hazardous',color:'#cf719d'}
];
export const category=aqi=>categories.find(c=>aqi<=c.max);
let readingMode='demo';
const liveReadings=new Map();
export function setReadingMode(mode){readingMode=mode==='live'?'live':'demo';}
export function setLiveReading(id,record){if(cities.some(c=>c.id===id))liveReadings.set(id,record);}
export function getLiveReading(id){return liveReadings.get(id)??null;}
export const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
export function pmFromAqi(aqi){
 const breakpoints=[[0,50,0,9],[51,100,9.1,35.4],[101,150,35.5,55.4],[151,200,55.5,125.4],[201,300,125.5,225.4],[301,500,225.5,325.4]];
 const [lo,hi,cl,ch]=breakpoints.find(b=>aqi<=b[1])??breakpoints.at(-1);
 return Math.round((cl+(ch-cl)*(aqi-lo)/(hi-lo))*10)/10;
}
export function reading(city,hour=12){
 if(readingMode==='live'){
  const record=liveReadings.get(city.id);
  if(!record)return {aqi:null,pm:null,temp:null,humidity:null,color:'#a5bacb',label:'Loading live data',source:'unloaded'};
  return {...record,...category(record.aqi),source:'IQAir'};
 }
 const wave=h=>Math.sin((h/24)*Math.PI*2+city.index*.8)*city.baseAqi*.18+Math.cos((h/24)*Math.PI*4+city.index*.4)*city.baseAqi*.08;
 const aqi=clamp(Math.round(city.baseAqi+wave(hour)-wave(12)),3,499);
 const temp=Math.round(city.baseTemp+4*(Math.sin((hour-6)*Math.PI/12)-1));
 const humidity=clamp(Math.round(city.baseHumidity-4*(Math.sin((hour-6)*Math.PI/12)-1)),15,98);
 return {aqi,pm:pmFromAqi(aqi),temp,humidity,...category(aqi),source:'demo'};
}
export function geoVector(lat,lon){
 const p=lat*Math.PI/180,l=lon*Math.PI/180,c=Math.cos(p);
 return [c*Math.sin(l),Math.sin(p),c*Math.cos(l)];
}
export function rotateVector(v,lon,lat){
 const y=lon*Math.PI/180,p=lat*Math.PI/180,cy=Math.cos(y),sy=Math.sin(y),cp=Math.cos(p),sp=Math.sin(p);
 const x=v[0]*cy-v[2]*sy,z=v[0]*sy+v[2]*cy;
 return [x,v[1]*cp-z*sp,v[1]*sp+z*cp];
}
export function temperatureColor(temp){
 const palette=['#82b9d4','#99d2ba','#d2dd9b','#edcb87','#eb986d'];
 return palette[clamp(Math.floor((temp+10)/10),0,4)];
}
