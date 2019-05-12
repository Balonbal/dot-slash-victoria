# Medley server notes

By using wireshark while JechSoft Victoria tried to get qualification times from victoria some interesting element showed up. 


## Request

[medley request example link](http://www.medley.no/MedleyWS/Service.asmx/AlleTider?FraDato=20180613&TilDato=20190612&MedleyId=10189481)

MedleyID is mine (Pavel)

## Response


### real world example response 

```XML
<tidsjekkalle xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns="http://medley.no/">
<script/>
<t5>000028210</t5>
<t8>000025510</t8>
<t12>000057010</t12>
<t5sted>Bergen</t5sted>
<t8sted>Bergen</t8sted>
<t12sted>Bergen</t12sted>
<t5dato>20190309</t5dato>
<t8dato>20190309</t8dato>
<t12dato>20190308</t12dato>
<t5basseng>-1</t5basseng>
<t8basseng>-1</t8basseng>
<t12basseng>-1</t12basseng>
<medleyidfunnet>TRUE</medleyidfunnet>
</tidsjekkalle>
```

**Observations:**
- If a medley id is found then <medleyidfound> is set to TRUE else FALSE
- `<t>` tags are for times. I don't know what numbers behind each t means now
- `<t1> - <t99>` are tags containing time. I'm going to use number 3 as exaples below . `000028210` -> `00` number of hours, `00` number of minutes , `28` seconds, `21` milliseconds, `0` at the end is usually not sent to medley when a meet finnish. In other words:
```python
#psudoCode
numberOfHours = num(str(time[0]) + str(time[1]))
numberOfMinutes = num(str(time[2]) + str(time[3]))
numberOfseconds = num(str(time[4]) + str(time[5]))
numberOfmilliseconds = num(str(time[6]) + str(time[7]))
munberOf100thSecond = time[8]
```
- `<t3sted>` gives a place where the qual time has been archived. Totally useless information for us.
- `<t3dato>` gives the date the qual time was archived. Useless information as well
- `<t3basseng>` can only give two values `0` and `-1` (ikr). `-1` means 25m pool, `0` means 50m pool. Idk if there are even more values that are possible. We neet to take that in to account.
- incrementing or decrementing medleyID returns medleyidfound as `FALSE` most of the time. Maybe medleyID's are generated randomly and not incrementally?

## More investigation in victoria

After some digging i've found some more adresses that victoria uses:

- http://medley.no/tidsjekk/stevneoppsett.asmx/VisStevneoppsett?FraNr=1&FraDato=20190512
- http://www.medley.no/medleyws/service.asmx/Unntak?sMedleyId=
- http://www.medley.no/MedleyWS/Service.asmx/AlleTider?FraDato=20180613&TilDato=20190612&MedleyId= It returned medleyID `TRUE` but without any content
- http://www.medley.no/medleyws/service.asmx/MedleyId?sLisensnr=10116201
- http://www.medley.no/medleyws/service.asmx/Poeng?sPoengtype=FINA-2018
- http://medley.no/tidsjekk/rekorder.asmx/VisRekordtyper
- http://medley.no/tidsjekk/rekorder.asmx/VisRekorder?rekordtypenr=%202

Didn't check live transfer program just yet. Project for another day.