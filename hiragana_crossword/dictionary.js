const kMetaDict = new MetaDictionary([
  [
    'lesson 1', parseWordCsv(`
good morning,,,ohayou,
hello,good afternoon,,konnichiha,
good evening,,,konbanha,
goodbye,,,sayounara,
see you,,,ja mata,
well,healthy,,genki,
meh,so so,,maa maa,
thank you,,,arigatou,
no worries,,,douitashimashite,
please,,,onegaishimasu,
is,,,desu,
listen,,,kiite,
look,,,mite,
write,,,kaite,
say,,,itte,
practice,,,renshuu,
once again,one more time,,mouichido,
great,nice,,ii,
excellent,,,subarashii,
understand,comprehend,,wakari,
question,,,shitsumon,
yes,,,hai,
no,,,iie,
sorry,excuse me,,sumimasen,
start,beginning,,hajime,
review,,,fukushuu,
finish,,,owari,
me,,,watashi,
you,,,anata,
teacher,,,sensei,kyoushi
student,,,gakusei,
employee,office worker,,kaishain,
lawyer,,,bengoshi,
nurse,,,kangoshi,
engineer,,,enjinia,
hospital,,,byouin,
school,,,gakkou,
university,,,daigaku,
high school,,,koukou,
bank,,,ginkou,
company,,,kaisha,
country,,,kuni,
japan,,,nihon,
china,,,chuugoku,
germany,,,doitsu,
england,,,igirisu,
america,,,amerika,
australia,,,oosutoraria,
india,,,indo,
korea,,,kankoku,
france,,,furansu,
thailand,,,tai,
new zealand,,,nyuujirando,
nationality,,,kunijin,`)
  ],
  [
    'lesson 2', parseWordCsv(`
this (polite),,,kochira,
this,,,kore,
who (polite),,,donata,
who,,,dare,
"that (near, polite)",,,sochira,
that (near),,,sore,
"that (far, polite)",,,achira,
that (far),,,are,
pen,,,pen,
bag,,,kaban,
smart phone,,,sumaho,
mobile phone,,,keitai,
key,,,kagi,
book,,,hon,
wallet,,,saifu,
file,,,fuairu,
clock,,,tokei,
umbrella,,,kasa,
glasses,,,megane,
newspaper,,,shinbun,
business card,,,meishi,
name,,,namae,
address,,,juusho,
telephone,phone,,denwa,
number,,,bangou,
email,,,meeru,
email address,,,meeruadoresu,meado
what,,,nan,
zero,,,zero,rei
one,,,ichi,
two,,,ni,
three,,,san,
four,,,yon,shi
five,,,go,
six,,,roku,
seven,,,nana,shichi
eight,,,hachi,
nine,,,kyuu,
ten,,,juu,`)
  ],
  [
    'lesson 3', parseWordCsv(`
shop,,,mise,
person,,,hito,
what time,,,nanji,
from,,,kara,
until,,,made,
supermarket,,,suupaa,
restaurant,,,resutoran,
gym,,,jimu,
job,work,,shigoto,
meeting,conference,,kaigi,
break,,,yasumi,
midday,,,hiru,
lunch,,,hirugohan,
morning,,,asa,
breakfast,,,asagohan,
evening,,,ban,
dinner,,,bangohan,
night,,,yoru,
department store,,,depaato,
post office,,,yuubinkyoku,
movie,film,,eiga,
movie theatre,,,eigakan,
library,,,toshokan,
pool,,,puuru,
concert,,,konsaato,
hour,,,jikan,
one o'clock,,,ichiji,
two o'clock,,,niji,
three o'clock,,,sanji,
four o'clock,,,yoji,
five o'clock,,,goji,
six o'clock,,,rokuji,
seven o'clock,,,shichiji,
eight o'clock,,,hachiji,
nine o'clock,,,kuji,
ten o'clock,,,juuji,
eleven o'clock,,,juuichiji,
twelve o'clock,,,juuniji,
minute,,,fun,
half,,,han,
five minutes,,,gofun,
ten minutes,,,juppun,
fifteen minutes,,,juugofun,
twenty minutes,,,nijuppun,
twenty five minutes,,,nijuugofun,
thirty minutes,,,sanjuppun,han
thirty five minutes,,,sanjuugofun,
forty minutes,,,yonjuppun,
forty five minutes,,,punjuugofun,
fifty minutes,,,gojuppun,
fifty five minutes,,,gojuugofun,
a.m.,,,gozen,
p.m.,,,gogo,`)
  ],
  [
    'lesson 4', parseWordCsv(`
welcome,,,irasshaimase,
show,,,misete,
how much,,,ikura,
please (give me),,,kudasai,
credit card,card,,kaado,
television,,,terebi,
tablet,,,taburetto,
computer,,,pasokon,
refrigerator,fridge,,reizouko,
air conditioner,,,eakon,
microwave,,,denshirenji,
toaster,,,toosutaa,
ballpoint pen,,,boorupen,
mechanical pencil,,,shaapen,
coffee,,,koohii,
green tea,,,ocha,
black tea,,,koucha,
juice,,,juusu,
sandwich,,,sando,sandoicchi
salad,,,sarada,
curry,,,karee,
cake,,,keeki,
chocolate,,,chokoreeto,
twenty,,,nijuu,
thirty,,,sanjuu,
forty,,,yonjuu,
fifty,,,gojuu,
sixty,,,rokujuu,
seventy,,,nanajuu,
eighty,,,hachijuu,
ninety,,,kyujuu,
one hundred,hundred,,hyaku,
two hundred,,,nihyaku,
three hundred,,,sanbyaku,
four hundred,,,yonhyaku,
five hundred,,,gohyaku,
six hundred,,,roppyaku,
seven hundred,,,nanahyaku,
eight hundred,,,happyaku,
nine hundred,,,kyuuhyaku,
one thousand,thousand,,sen,
two thousand,,,nisen,
three thousand,,,sanzen,
four thousand,,,yonsen,
five thousand,,,gosen,
six thousand,,,rokusen,
seven thousand,,,nanasen,
eight thousand,,,hassen,
nine thousand,,,kyuusen,
ten thousand,,,ichiman,
twenty thousand,,,niman,
thirty thousand,,,sanman,
forty thousand,,,yonman,
fifty thousand,,,goman,
sixty thousand,,,rokuman,
seventy thousand,,,nanaman,
eighty thousand,,,hachiman,
ninety thousand,,,kyuuman,
yen,,,en,
decimal point,,,ten,
part,fraction,,bun,`)
  ],
  [
    'lesson 5', parseWordCsv(`
wine,,,wain
bag,,,fukuro
basement,underground,,chika
floor,level,,kai
where,,,doko
which (of 3 or more),,,dore
which (of 2),,,dochira
this,,,kono
that (near),,,sono
that (far),,,ano
red,,,akai
blue,,,aoi
black,,,kuroi
white,,,shiroi
green,,,midori
yellow,,,kiiroi
purple,,,murasaki
orange,,,orenji
pink,,,pinku
brown,,,chairoi
big,large,,ookii
small,,,chiisai
shirt,,,shatsu
shoes,,,kutsu
dish,plate,,osara
glass,cup,,koppu
towel,,,taoru
camera,,,kamera
bathroom,,,otearai
vacuum,,,soujiki
italy,,,itaria
switzerland,,,suisu
meat,,,niku
beef,,,gyuuniku
apple,,,ringo
mandarin,,,mikan
bowl,teacup,,chawan
cheese,,,chiizu
ground floor,first floor,,ikkai
second floor,,,nikai
third floor,,,sangai
fourth floor,,,yonkai
fifth floor,,,gokai
sixth floor,,,rokkai
seventh floor,,,nanakai
eighth floor,,,hakkai
ninth floor,,,kyuukai
tenth floor,,,jukkai
many,,,takusan
"one (count, flat)",,,ichimai
"two (count, flat)",,,nimai
"three (count, flat)",,,sanmai
"four (count, flat)",,,yonmai
"five (count, flat)",,,gomai
"six (count, flat)",,,rokumai
"seven (count, flat)",,,nanamai
"eight (count, flat)",,,hachimai
"nine (count, flat)",,,kyuumai
"ten (count, flat)",,,juumai
"one (count, long)",,,ippon
"two (count, long)",,,nihon
"three (count, long)",,,sanbon
"four (count, long)",,,yonhon
"five (count, long)",,,gohon
"six (count, long)",,,roppon
"seven (count, long)",,,nanahon
"eight (count, long)",,,happon
"nine (count, long)",,,kyuuhon
"ten (count, long)",,,juppon
"one (count, general)",,,hitotsu
"two (count, general)",,,futatsu
"three (count, general)",,,mittsu
"four (count, general)",,,yottsu
"five (count, general)",,,itsutsu
"six (count, general)",,,muttsu
"seven (count, general)",,,nanatsu
"eight (count, general)",,,yattsu
"nine (count, general)",,,kokonotsu
"ten (count, general)",,,too`)
  ],
  [
    'lesson 6', parseWordCsv(`
yesterday,,,kinou
today,,,kyou
tomorrow,,,ashita
day before yesterday,,,ototoi
day after tomorrow,,,asatte
day,,,hi
week,,,shuu
last week,,,senshuu
this week,,,konshuu
next week,,,raishuu
month,,,getsu
last month,,,sengetsu
this month,,,kongetsu
next month,,,raigetsu
year,,,nen
last year,,,kyonen
this year,,,kotoshi
next year,,,rainen
branch (company),,,shisha
airport,,,kuukou
station,,,eki
park,,,kouen
home,,,uchi
house,,,ie
friend,,,tomodachi
colleague,,,douryou
boss,,,joushi
family,,,kazoku
student,,,gakusei`)
  ],
  [
    'lesson 7', parseWordCsv(`
business trip,,,shucchou
so,,,sou
train,,,densha
subway,,,chikatetsu
car,,,kuruma
taxi,,,takushii
bullet train,,,shinkansen
airplane,,,hikouki
motorbike,,,baiku
bicycle,,,jitensha
festival,,,omatsuri
birthday,,,tanjoubi
summer,,,natsu
autumn,,,aki
winter,,,fuyu
spring,,,haru
break,,,yasumi
trip,,,ryokou
which month,,,nangatsu
which day (of the month),,,nannichi
which day (of the week),,,naNyoubi
walking,,,aruite
hotel,,,hoteru
sunday,,,nichiyoubi
monday,,,getsuyoubi
tuesday,,,kayoubi
wednesday,,,suiyoubi
thursday,,,mokuyoubi
friday,,,kiNyoubi
saturday,,,doyoubi
january,,,ichigatsu
february,,,nigatsu
march,,,sangatsu
april,,,shigatsu
may,,,gogatsu
june,,,rokugatsu
july,,,shichigatsu
august,,,hachigatsu
september,,,kugatsu
october,,,juugatsu
november,,,juuichigatsu
december,,,juunigatsu
date,,,nichi
first (of the month),,,tsuitachi
second (of the month),,,futsuka
third (of the month),,,mikka
fourth (of the month),,,yokka
fifth (of the month),,,itsuka
sixth (of the month),,,muika
seventh (of the month),,,nanoka
eighth (of the month),,,youka
nineth (of the month),,,kokonoka
tenth (of the month),,,tooka
eleventh (of the month),,,juuichinichi
twelveth (of the month),,,juuninichi
thirteenth (of the month),,,juusannichi
fourteenth (of the month),,,juuyokka
fifteenth (of the month),,,juugonichi
sixteenth (of the month),,,juurokunichi
seventeenth (of the month),,,juushichinichi
eighteenth (of the month),,,juuhachinichi
nineteenth (of the month),,,juukunichi
twentieth (of the month),,,hatsuka
twenty first (of the month),,,nijuuichinichi
twenty second (of the month),,,nijuuninichi
twenty third (of the month),,,nijuusannichi
twenty fourth (of the month),,,nijuuyokka
twenty fifth (of the month),,,nijuugonichi
twenty sixth (of the month),,,nijuurokunichi
twenty seventh (of the month),,,nijuushichinichi
twenty eighth (of the month),,,nijuuhachinichi
twenty ninth (of the month),,,nijuukunichi
thirtieth (of the month),,,sanjuunichi
thirty first (of the month),,,sanjuuichinichi`)
  ],
  [
    'lesson 8', parseWordCsv(`
weekend,,,shuumatsu
breakfast,,,asagohan
lunch,,,hirugohan
dinner,,,bangohan
water,,,mizu
tempura,,,tenpura
music,,,ongaku
library,,,toshokan
"one (count, person)",alone,,hitori
"two (count, people)",,,futari
"three (count, people)",,,sannin
"four (count, people)",,,yonin
"five (count, people)",,,gonin
"six (count, people)",,,rokunin
"seven (count, people)",,,shichinin
"eight (count, people)",,,hachinin
"nine (count, people)",,,kyuunin
"ten (count, people)",,,juunin`)
  ],
  [
    'lesson 9', parseWordCsv(`
every day,,,mainichi,
every morning,,,maiasa,
every evening,,,maiban,
every week,,,maishuu,
every month,,,maitsuki,
every year,,,maitoshi,
always,,,itsumo,
often,,,yoku,
sometimes,,,tokidoki,
rarely,,,amari~masen,
never,,,zenzen~masen,
here,,,koko,
there (near),,,soko,
there (far),,,asoko,
where,,,doko,
location,place,,basho,tokoro
president (of company),,,shachou,
japanese (language),,,nihongo,
vegetable,,,yasai,
next,,,tsugi,
next time,,,kondo,
recommendation,,,osusume,
beverage,,,nomimono,
bill,,,kaikei,
stuff,,,mono,
separately,,,betsubetsuni,
father (mine),,,chichi,
mother (mine),,,haha,
wife (mine),,,tsuma,kanai
husband (mine),,,otto,shujin
family (other),,,gokazoku,
father (other),,,otousan,
mother (other),,,okaasan,
wife (other),,,okusan,
husband (other),,,goshujin,`)
  ],
  [
    'lesson 10', parseWordCsv(`
very,,,totemo
snack,sweet,,okashi
flower,,,hana
fireworks,,,hanabi
ocean,beach,,umi
beach,,,biichi
really,truly,,hontouni
weather,,,tenki
little bit,dislike,,chotto
little bit,,,sukoshi`)
  ],
  [
    'lesson 11', parseWordCsv(`
how (about),,,dou
photo,,,shashin
painting,,,e
yes,,,ee
about,roughly,,gurai
but,,,ga
how long,,,donokurai
festival,,,omatsuri
class,,,kurasu
date (event),,,deeto
sale (event),,,seeru
test,,,tesuto
ski,,,sukii`)
  ],
  [
    'lesson 12', parseWordCsv(`
shrine (shinto),,,jinja,
temple (buddhist),,,otera,
church (christian),,,kyoukai,
hot spring,,,onsen,
spa,,,supa,
man,,,otoko,otokonohito
woman,,,onna,onnanohito
inn,,,ryokan,
drawer,,,hikidashi,
ramen shop,,,raameNya,
soba shop,,,sohaya,
pocket,,,poketto,
no one,,,daremo~masen,
information desk,,,uketsuke,
meeting room,,,kaigishitsu,
parking lot,,,chuushajou,
room,,,heya,
kettle,,,denkipotto,
bed,,,beddo,
desk,,,tsukue,
chair,,,isu,
bin,,,gomibako,
table,,,teeburu,
waterfall,,,taki,
lake,,,mizuumi,
on,,,ue,
under,,,shita,
inside,,,naka,
in front,,,mae,
behind,,,ushiro,
next to,,,tonari,
near,,,chikaku,
"and (nouns, exhaustive)",,,to,,,
"and (nouns, partial)",,,ya,,,
boat,,,fune,,,`)
  ],
  [
    'lesson 13', parseWordCsv(`
also,,sorekara,
near,close,chikai,
far,,tooi,
taxi stand,,takushii noriba,
bus terminal,,basu noriba,
dock,,booto noriba,
bus stop,,basutei,
police box,,kouban,
hospital,,byouin,
book store,,honnya,
bakery,,pannya,
ramen shop,,raamennya,
eraser,,keshigomu,
pencil,,enpitsu,
scissors,,hasami,
drawer,,hikidashi,
paper clip,,kurippu,
right there,,sugu soko,
many,much,takusan,
a little bit,,sukoshi,
child,,kodomo,ko
girl,,onna no ko,
boy,,otoko no ko,
woman (polite),,onna no hito,
man (polite),,otoko no hito,
on,,ue,
front,,mae,
next to,,tonari,
behind,,ushiro,
inside,,naka,
under,,shita,
about,,gurai,`)
  ],
  [
    'lesson 14', parseWordCsv(`
scarf,,sukaafu,
are you sure,,iindesuka,
because,,kara,
earrings,,iyaringu,
necklance,,nekkuresu,
ring,,yubiwa,
blouse,,burausu,
bag,,kaban,baggu
ticket,,chiketto,
sweater,jumper,seetaa,
tie,necktie,nekutai,
souvenir,,omiyage,
beani,,nitobo,
money,,okane,
schedule,plan,yotei,
appointment,promise,yakusoku,
time,,jikan,
night,,yoru,
wedding,marriage,kekkon,
anniversary,,kinenbi,
well (competence),,yoku,
this evening,,konban,`)
  ],
  [
    'lesson 15', parseWordCsv(`
cousin,,itoko
robot,,robotto
awesome,,sugoi
song,,uta
fruit,,kudamono
food,,ryouri
pizza,,piza
jazz,,jazu
art museum,,bijutsukan
baseball,,yakyuu
diving,,daibingu
golf,,gorufu
whiskey,,uisukii`)
  ],
  [
    'lesson 16', parseWordCsv(`
next,,tsugi
event,,ibento
therefore,,kara
together,,isshoni
sounds good,,zehi
fireworks festival,,hanabitaikai
snow festival,,yukimatsuri
game,,shiai
platform,,hoomu
exit,,deguchi
west,,nishi
east,,higashi
north,,kita
south,,minami
hungry,,onakagasukimashita
thirsty,,nodogakawakimashita
tired (not sleepy),,tsukaremashita
vocabulary,,tango
unfortunately,,zannen
is that so,,soudesuka
bye,,jamata
next time,,kondo
something,,nanika`)
  ],
  [
    'lesson 17', parseWordCsv(`
before,,,mae
after,,,ato
lobby,,,robii
hobby,,,shumi
dance (noun),,,dansu
letter,,,tegami
in future,,,shourai
town,,,machi
furniture,,,kagu
club,,,kurabu
antiques,,,antiiku
hair dresser,,,biyouin
hand,,,te
tree,,,ki
eye,,,me
mouth,,,kuchi
nose,,,hana
ear,,,mimi
face,,,kao
material,document,,shiryou`)
  ],
  [
    'lesson 18', parseWordCsv(`
report,,,repooto
factory,,,koujou
package,,,pakkeeji
after,,,ato
take care,be careful,,kiwotsukete`)
  ],
  [
    'lesson 19', parseWordCsv(`
future,,,,mirai
intersection,,,,kousaten
traffic light,,,,shingou
road,,,,michi
corner,,,,kado
beyond,tip,previous,,saki
front,,,,mae
just before,,,,temae
right,,,,migi
left,,,,hidari
straight,,,,massugu
delivery service,,,,takuhaibin
mail,,,,yuubin
motorbike courier,,,,baikubin
documents,,,,shorui
package,,,,nimotsu
catalog,,,,katarogu
street,,,,toori
bridge,,,,hashi
by (time),,,,madeni
to,,,,made
building,,,,biru`)
  ],
  [
    'lesson 20', parseWordCsv(`
museum,,,hakubutsukan
airport,,,kuukou
platform number,,,bansen
one week,,,isshuukan
two weeks,,,nishuukan
three weeks,,,sanshuukan
four weeks,,,yonshuukan
five weeks,,,goshuukan
six weeks,,,rokushuukan
one month,,,ikkagetsu
two months,,,nikagetsu
three months,,,sankagetsu
four months,,,yonkagetsu
five months,,,gokagetsu
six months,,,rokkagetsu`)
  ],
  [
    'lesson 21', parseWordCsv(`
past,long ago,,mukashi
english,,,eigo
foot,leg,,ashi
hurt,painful,,itai
head,,,atama
eye,,,me
tooth,,,ha
throat,,,nodo
stomach,belly,,onaka
shoulder,,,kata
back,,,senaka
lower back,,,koshi
hand,,,te
ear,,,mimi
hair,,,kami
face,,,kao
mouth,,,kuchi
node,,,hana
eyebrow,,,mayuge
arm,,,ude
finger,,,yubi
neck,,,kubi
feeling,mood,,kibun
fever,,,netsu
degree,,,do
window,,,mado
curtain,,,kaaten
light (electric),,,denki
garden,yard,,niwa`)
  ],
  [
    'lesson 22', parseWordCsv(`
forbid,,,kinshi
no entry,,,tachiirikinshi
no parking,,,chuushakinshi
no smoking,,,kinen
door,,,doa
vase,,,kabin
entrance,,,iriguchi
exit,,,deguchi`)
  ],
  [
    'i-adjectives', parseComboCsv(`
,,,modifying noun,present positive,present negative,past positive,past negative
,,,i,idesu,kunaidesu,kattadesu,kunakattadesu
big,,,ookii,ookiidesu,ookikunaidesu,ookikattadesu,ookikunakattadesu
small,,,chiisai,chiisaidesu,chiisakunaidesu,chiisakattadesu,chiisakunakattadesu
expensive,tall,,takai,takaidesu,takakunaidesu,takakattadesu,takakunakattadesu
cheap,inexpensive,,yasui,yasuidesu,yasukunaidesu,yasukattadesu,yasukunakattadesu
new,fresh,,atarashii,atarashiidesu,atarashikunaidesu,atarashikattadesu,atarashikunakattadesu
old (fashioned),outdated,,furui,furuidesu,furukunaidesu,furukattadesu,furukunakattadesu
good,nice,,ii,iidesu,yokunaidesu,yokattadesu,yokunakattadesu
bad,,,warui,waruidesu,warukunaidesu,warukattadesu,warukunakattadesu
hot,,,atsui,atsuidesu,atsukunaidesu,atsukattadesu,atsukunakattadesu
cold (weather),,,samui,samuidesu,samukunaidesu,samukattadesu,samukunakattadesu
warm,,,atatakai,atatakaidesu,atatakakunaidesu,atatakakattadesu,atatakakunakattadesu
cool (weather),,,suzushii,suzushiidesu,suzushikunaidesu,suzushikattadesu,suzushikunakattadesu
interesting,funny,,omoshiroi,omoshiroidesu,omoshirokunaidesu,omoshirokattadesu,omoshirokunakattadesu
delicious,,,oishii,oishiidesu,oishikunaidesu,oishikattadesu,oishikunakattadesu
old (aged),,,toshii,toshiidesu,toshikunaidesu,toshikattadesu,toshikunakattadesu
fun,pleasant,,tanoshii,tanoshiidesu,tanoshikunaidesu,tanoshikattadesu,tanoshikunakattadesu
boring,,,tsumaranai,tsumaranaidesu,tsumaranakunaidesu,tsumaranakattadesu,tsumaranakunakattadesu
difficult,,,muzukashii,muzukashiidesu,muzukashikunaidesu,muzukashikattadesu,muzukashikunakattadesu
busy,,,isogashii,isogashiidesu,isogashikunaidesu,isogashikattadesu,isogashikunakattadesu
dangerous,,,abunai,abunaidesu,abunakunaidesu,abunakattadesu,abunakunakattadesu
`)
  ],
  [
    'na-adjectives', parseComboCsv(`
,,,modifying noun,present positive,present negative,past positive,past negative
,,,na,desu,jaarimasen,deshita,jaarimasendeshita
lively,,,nigiyakana,nigiyakadesu,nigiyakajaarimasen,nigiyakadeshita,nigiyakajaarimasendeshita
quiet,,,shizukana,shizukadesu,shizukajaarimasen,shizukadeshita,shizukajaarimasendeshita
convenient,,,benrina,benridesu,benrijaarimasen,benrideshita,benrijaarimasendeshita
famous,,,yuumeina,yuumeidesu,yuumeijaarimasen,yuumeideshita,yuumeijaarimasendeshita
pretty,clean,,kireina,kireidesu,kireijaarimasen,kireideshita,kireijaarimasendeshita
easy,simple,,kantanna,kantandesu,kantanjaarimasen,kantandeshita,kantanjaarimasendeshita
hard,serious,,taihenna,taihendesu,taihenjaarimasen,taihendeshita,taihenjaarimasendeshita
free,,,himana,himadesu,himajaarimasen,himadeshita,himajaarimasendeshita
lovely,nice,,sutekina,sutekidesu,sutekijaarimasen,sutekideshita,sutekijaarimasendeshita
like,favorite,,sukina,sukidesu,sukijaarimasen,sukideshita,sukijaarimasendeshita
skilled,,,jouzuna,jouzudesu,jouzujaarimasen,jouzudeshita,jouzujaarimasendeshita
`)
  ],
  [
    'g1-verbs', parseComboCsv(`
,,,,present positive,present negative,past positive,past negative,dictionary,volitional,te
,,,,imasu,imasen,imashita,imasendeshita,u,imashou,te
go,,,,ikimasu,ikimasen,ikimashita,ikimasendeshita,iku,ikimashou,itte
return,,,,kaerimasu,kaerimasen,kaerimashita,kaerimasendeshita,kaeru,kaerimashou,kaette
drink,,,,nomimasu,nomimasen,nomimashita,nomimasendeshita,nomu,nomimashou,nonde
buy,,,,kaimasu,kaimasen,kaimashita,kaimasendeshita,kau,kaimashou,katte
read,,,,yomimasu,yomimasen,yomimashita,yomimasendeshita,yomu,yomimashou,yonde
listen,ask,,,kikimasu,kikimasen,kikimashita,kikimasendeshita,kiku,kikimashou,kiite
walk,,,,arukimasu,arukimasen,arukimashita,arukimasendeshita,aruku,arukimashou,aruite
send,,,,okurimasu,okurimasen,okurimashita,okurimasendeshita,okuru,okurimashou,okutte
meet,,,,aimasu,aimasen,aimashita,aimasendeshita,au,aimashou,atte
draw,write,,,kakimasu,kakimasen,kakimashita,kakimasendeshita,kaku,kakimashou,kaite
take (thing),,,,torimasu,torimasen,torimashita,torimasendeshita,toru,torimashou,totte
climb,,,,noborimasu,noborimasen,noborimashita,noborimasendeshita,noboru,noborimashou,nobotte
make,,,,tsukurimasu,tsukurimasen,tsukurimashita,tsukurimasendeshita,tsukuru,tsukurimashou,tsukutte
exist (inanimate),be (inanimate),have,,arimasu,arimasen,arimashita,arimasendeshita,aru,arimashou,atte
receive,,,,moraimasu,moraimasen,moraimashita,moraimasendeshita,morau,moraimashou,moratte
lend,loan,,,kashimasu,kashimasen,kashimashita,kashimasendeshita,kasu,kashimashou,kashite
dance (verb),,,,odorimasu,odorimasen,odorimashita,odorimasendeshita,odoru,odorimashou,odotte
run,,,,hashirimasu,hashirimasen,hashirimashita,hashirimasendeshita,hashiru,hashirimashou,hashitte
swim,,,,oyogimasu,oyogimasen,oyogimashita,oyogimasendeshita,oyogu,oyogimashou,oyoide
sing,,,,utaimasu,utaimasen,utaimashita,utaimasendeshita,utau,utaimashou,utatte
talk,,,,hanashimasu,hanashimasen,hanashimashita,hanashimasendeshita,hanasu,hanashimashou,hanashite
learn,,,,naraimasu,naraimasen,naraimashita,naraimasendeshita,narau,naraimashou,naratte
wash,,,,araimasu,araimasen,araimashita,araimasendeshita,arau,araimashou,aratte
live,,,,sumimasu,sumimasen,sumimashita,sumimasendeshita,sumu,sumimashou,sunde
die,,,,shinimasu,shinimasen,shinimashita,shinimasendeshita,shinu,shinimashou,shinde
play (games),,,,asobimasu,asobimasen,asobimashita,asobimasendeshita,asobu,asobimashou,asonde
wait,,,,machimasu,machimasen,machimashita,machimasendeshita,matsu,machimashou,matte
turn,,,,magarimasu,magarimasen,magarimashita,magarimasendeshita,magaru,magarimashou,magatte
say,,,,iimasu,iimasen,iimashita,iimasendeshita,iu,iimashou,itte
arrive,,,,tsukimasu,tsukimasen,tsukimashita,tsukimasendeshita,tsuku,tsukimashou,tsuite
take (time),,,,kakarimasu,kakarimasen,kakarimashita,kakarimasendeshita,kakaru,kakarimashou,kakatte
get on,board,,,norimasu,norimasen,norimashita,norimasendeshita,noru,norimashou,notte
use,,,,tsukaimasu,tsukaimasen,tsukaimashita,tsukaimasendeshita,tsukau,tsukaimashou,tsukatte
sit down,,,,suwarimasu,suwarimasen,suwarimashita,suwarimasendeshita,suwaru,suwarimashou,suwatte
enter,,,,hairimasu,hairimasen,hairimashita,hairimasendeshita,hairu,hairimashou,haitte
turn off,,,,keshimasu,keshimasen,keshimashita,keshimasendeshita,kesu,keshimashou,keshite
rest,,,,yasumimasu,yasumimasen,yasumimashita,yasumimasendeshita,yasumu,yasumimashou,yasunde
learn,study,,,manabimasu,manabimasen,manabimashita,manabimasendeshita,manabu,manabimashou,manande
stand up,,,,tachimasu,tachimasen,tachimashita,tachimasendeshita,tatsu,tachimashou,tatte
inhale,,,,suimasu,suimasen,suimashita,suimasendeshita,suu,suimashou,sutte
smoke,,,,tabakowosuimasu,tabakowosuimasen,tabakowosuimashita,tabakowosuimasendeshita,tabakowosuu,tabakowosuimashou,tabakowosutte
touch,,,,sawarimasu,sawarimasen,sawarimashita,sawarimasendeshita,sawaru,sawarimashou,sawatte
`)
  ],
  [
    'g2-verbs', parseComboCsv(`
,,,,present positive,present negative,past positive,past negative,dictionary,volitional,te
,,,,masu,masen,mashita,masendeshita,ru,mashou,te
exist (animate),be (animate),stay,,imasu,imasen,imashita,imasendeshita,iru,imashou,ite
eat,,,,tabemasu,tabemasen,tabemashita,tabemasendeshita,taberu,tabemashou,tabete
see,watch,,,mimasu,mimasen,mimashita,mimasendeshita,miru,mimashou,mite
tell,teach,,,oshiemasu,oshiemasen,oshiemashita,oshiemasendeshita,oshieru,oshiemashou,oshiete
sleep,,,,nemasu,nemasen,nemashita,nemasendeshita,neru,nemashou,nete
wear,,,,kimasu,kimasen,kimashita,kimasendeshita,kiru,kimashou,kite
show,,,,misemasu,misemasen,misemashita,misemasendeshita,miseru,misemashou,misete
borrow,,,,karimasu,karimasen,karimashita,karimasendeshita,kariru,karimashou,karite
give,raise,,,agemasu,agemasen,agemashita,agemasendeshita,ageru,agemashou,agete
shower (verb),,,,shawaawoabimasu,shawaawoabimasen,shawaawoabimashita,shawaawoabimasendeshita,shawaawoabiru,shawaawoabimashou,shawaawoabite
start,begin,,,hajimemasu,hajimemasen,hajimemashita,hajimemasendeshita,hajimeru,hajimemashou,hajimete
sleep,,,,nemasu,nemasen,nemashita,nemasendeshita,neru,nemashou,nete
stop,,,,tomemasu,tomemasen,tomemashita,tomemasendeshita,tomeru,tomemashou,tomete
deliver,,,,todokemasu,todokemasen,todokemashita,todokemasendeshita,todokeru,todokemashou,todokete
leave,,,,demasu,demasen,demashita,demasendeshita,deru,demashou,dete
get off,,,,orimasu,orimasen,orimashita,orimasendeshita,oriru,orimashou,orite
put,place,,,okimasu,okimasen,okimashita,okimasendeshita,okiru,okimashou,okite
open,,,,akemasu,akemasen,akemashita,akemasendeshita,akeru,akemashou,akete
close,,,,shimemasu,shimemasen,shimemashita,shimemasendeshita,shimeru,shimemashou,shimete
turn on,,,,tsukemasu,tsukemasen,tsukemashita,tsukemasendeshita,tsukeru,tsukemashou,tsukete
park,,,,tomemasu,tomemasen,tomemashita,tomemasendeshita,tomeru,tomemashou,tomete
put in,add,,,iremasu,iremasen,iremashita,iremasendeshita,ireru,iremashou,irete
`)
  ],
  [
    'irr-verbs', parseComboCsv(`
,,,present positive,present negative,past positive,past negative,dictionary,volitional,te
,,,imasu,imasen,imashita,imasendeshita,uru,imashou,ite
come,,,kimasu,kimasen,kimashita,kimasendeshita,kuru,kimashou,kite
do,,,shimasu,shimasen,shimashita,shimasendeshita,suru,shimashou,shite
study,,,benkyouwoshimasu,benkyouwoshimasen,benkyouwoshimashita,benkyouwoshimasendeshita,benkyouwosuru,benkyouwoshimashou,benkyouwoshite
shop,,,kaimonowoshimasu,kaimonowoshimasen,kaimonowoshimashita,kaimonowoshimasendeshita,kaimonowosuru,kaimonowoshimashou,kaimonowoshite
work,,,shigotowoshimasu,shigotowoshimasen,shigotowoshimashita,shigotowoshimasendeshita,shigotowosuru,shigotowoshimashou,shigotowoshite
phone,,,denwawoshimasu,denwawoshimasen,denwawoshimashita,denwawoshimasendeshita,denwawosuru,denwawoshimashou,denwawoshite
walk,,,sanpowoshimasu,sanpowoshimasen,sanpowoshimashita,sanpowoshimasendeshita,sanpowosuru,sanpowoshimashou,sanpowoshite
cook,,,ryouriwoshimasu,ryouriwoshimasen,ryouriwoshimashita,ryouriwoshimasendeshita,ryouriwosuru,ryouriwoshimashou,ryouriwoshite
eat (eg have lunch),,,shokujiwoshimasu,shokujiwoshimasen,shokujiwoshimashita,shokujiwoshimasendeshita,shokujiwosuru,shokujiwoshimashou,shokujiwoshite
stretch,,,sutoretchiwoshimasu,sutoretchiwoshimasen,sutoretchiwoshimashita,sutoretchiwoshimasendeshita,sutoretchiwosuru,sutoretchiwoshimashou,sutoretchiwoshite
download,,,daunroodoshimasu,daunroodoshimasen,daunroodoshimashita,daunroodoshimasendeshita,daunroodosuru,daunroodoshimashou,daunroodoshite
bring (thing),,,mottekimasu,mottekimasen,mottekimashita,mottekimasendeshita,mottekuru,mottekimashou,mottekite
bring (person),,,tsuretekimasu,tsuretekimasen,tsuretekimashita,tsuretekimasendeshita,tsuretekuru,tsuretekimashou,tsuretekite
oversleep,,,neboushimasu,neboushimasen,neboushimashita,neboushimasendeshita,nebousuru,neboushimashou,neboushite
`)
  ],
]);
