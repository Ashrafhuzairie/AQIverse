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
export const cities=rows.map((r,index)=>({id:r[0],name:r[1],country:r[2],code:r[3],region:r[4],lat:r[5],lon:r[6],baseAqi:r[7],baseTemp:r[8],baseHumidity:r[9],iqairPath:r[10],index}));
export const categories=[
 {max:50,label:'Good',color:'#54e89b'},
 {max:100,label:'Moderate',color:'#ffd76d'},
 {max:150,label:'Unhealthy for sensitive groups',color:'#ffa45c'},
 {max:200,label:'Unhealthy',color:'#ff718c'},
 {max:300,label:'Very unhealthy',color:'#ba9aff'},
 {max:Infinity,label:'Hazardous',color:'#cf719d'}
];
export const category=aqi=>categories.find(c=>aqi<=c.max);
export const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
export function pmFromAqi(aqi){
 const breakpoints=[[0,50,0,9],[51,100,9.1,35.4],[101,150,35.5,55.4],[151,200,55.5,125.4],[201,300,125.5,225.4],[301,500,225.5,325.4]];
 const [lo,hi,cl,ch]=breakpoints.find(b=>aqi<=b[1])??breakpoints.at(-1);
 return Math.round((cl+(ch-cl)*(aqi-lo)/(hi-lo))*10)/10;
}
export function reading(city,hour=12){
 const wave=h=>Math.sin((h/24)*Math.PI*2+city.index*.8)*city.baseAqi*.18+Math.cos((h/24)*Math.PI*4+city.index*.4)*city.baseAqi*.08;
 const aqi=clamp(Math.round(city.baseAqi+wave(hour)-wave(12)),3,499);
 const temp=Math.round(city.baseTemp+4*(Math.sin((hour-6)*Math.PI/12)-1));
 const humidity=clamp(Math.round(city.baseHumidity-4*(Math.sin((hour-6)*Math.PI/12)-1)),15,98);
 return {aqi,pm:pmFromAqi(aqi),temp,humidity,...category(aqi)};
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
