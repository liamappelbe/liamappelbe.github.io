const kMetaDict = new MetaDictionary([
  [
    'i-adjectives', parseComboCsv(`
,,,modifying noun,present positive,present negative,past positive,past negative
,,,i,idesu,kunaidesu,kattadesu,kunakattadesu
big,,,ookii,,,,
small,,,chiisai,,,,
expensive,tall,,takai,,,,
cheap,inexpensive,,yasui,,,,
new,fresh,,atarashii,,,,
old (fashioned),outdated,,furui,,,,
good,nice,,ii,,yokunaidesu,yokattadesu,yokunakattadesu
bad,,,warui,,,,
hot,,,atsui,,,,
cold (weather),,,samui,,,,
warm,,,atatakai,,,,
cool (weather),,,suzushii,,,,
interesting,funny,,omoshiroi,,,,
delicious,,,oishii,,,,
old (aged),,,toshii,,,,
fun,pleasant,,tanoshii,,,,
boring,,,tsumaranai,,,,
difficult,,,muzukashii,,,,
busy,,,isogashii,,,,`)
  ],
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
which day (of the week),,,nanyoubi
walking,,,aruite
hotel,,,hoteru
sunday,,,nichiyoubi
monday,,,getsuyoubi
tuesday,,,kayoubi
wednesday,,,suiyoubi
thursday,,,mokuyoubi
friday,,,kinyoubi
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
ramen shop,,,raamenya,
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
    'na-adjectives', parseComboCsv(`
,,,modifying noun,present positive,present negative,past positive,past negative
,,,na,desu,jaarimasen,deshita,jaarimasendeshita
lively,,,nigiyakana,,,,
quiet,,,shizukana,,,,
convenient,,,benrina,,,,
famous,,,yuumeina,,,,
pretty,clean,,kireina,,,,
easy,simple,,kantanna,,,,
hard,serious,,taihenna,,,,
free,,,himana,,,,`)
  ],
  [
    'verbs', parseComboCsv(`
,,,present positive,present negative,past positive,past negative
,,,masu,masen,mashita,masendeshita
go,,,ikimasu,,,
come,,,kimasu,,,
return,,,kaerimasu,,,
eat,,,tabemasu,,,
see,,,mimasu,,,
drink,,,nomimasu,,,
buy,,,kaimasu,,,
read,,,yomimasu,,,
listen,ask,,kikimasu,,,
watch,,,mimasu,,,
do,,,shimasu,,,
study,,,benkyouwoshimasu,,,
shop,,,kaimonowoshimasu,,,
work,,,shigotowoshimasu,,,
phone,,,denwawoshimasu,,,
walk,,,sanpowoshimasu,,,
walk,,,arukimasu,,,
send,,,okurimasu,,,
meet,,,aimasu,,,
tell,teach,,oshiemasu,,,
take,,,torimasu,,,
climb,,,noborimasu,,,
show,,,misemasu,,,
exist (inanimate),,,arimasu,,,
exist (animate),,,imasu,,,`)
  ],
]);
