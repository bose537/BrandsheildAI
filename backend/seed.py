import base64
import io
from PIL import Image, ImageDraw
from .models import Brand, Candidate


def demo_logo():
    image = Image.new('RGB', (96,96), '#101e2d')
    draw = ImageDraw.Draw(image)
    draw.polygon([(48,10),(80,24),(74,65),(48,87),(22,65),(16,24)], fill='#65d6b0')
    draw.line([(30,47),(43,60),(67,34)], fill='#101e2d', width=9)
    buffer = io.BytesIO()
    image.save(buffer, format='PNG')
    return 'data:image/png;base64,' + base64.b64encode(buffer.getvalue()).decode()


def demo_brand():
    return Brand(name='Northstar', website='https://northstar.example', logo=demo_logo(), socials=[{'platform':'Instagram','username':'northstar'},{'platform':'X','username':'northstar'}], apps=[{'name':'Northstar','package':'com.northstar.mobile','developer':'Northstar Labs','store':'Google Play'}], publishers=['Northstar Labs'], keywords=['delivery','shopping'], variations=['Northstar Shopping']).model_dump()


def candidates(brand):
    b = brand['name']; handle = brand['socials'][0]['username'] if brand['socials'] else ''.join(c for c in b.lower() if c.isalnum())
    platform = brand['socials'][0]['platform'] if brand['socials'] else 'Instagram'
    official = brand['apps'][0] if brand['apps'] else {'name':b,'package':'com.example.official','developer':brand['publishers'][0] if brand['publishers'] else b+' Labs','store':'Google Play'}
    shared = 'https://rewards-check.example/claim'
    rows = []
    def social(username, name='', bio='', url='', logo=''):
        rows.append(dict(channel='social',platform=platform,username=username,name=name,bio=bio,url=url,logo=logo))
    def app(name, developer, description='', url='', package='', logo=''):
        rows.append(dict(channel='app',name=name,developer=developer,description=description,url=url,package=package,store=official['store'],logo=logo))
    if brand['socials']:
        social(handle,b,'Our official profile.',brand['website'],brand['logo'])
    social(handle+'_support_verify',b+' Support','Official help. Verify your login and password.',shared,brand['logo'])
    social(handle+'_rewards',b+' Rewards','Claim your giveaway reward.',shared,brand['logo'])
    social(handle.replace('a','4').replace('o','0'),b,'Independent shopping updates')
    social(handle+'_official_help',b+' Help','Customer care account. Send your OTP.', 'https://support-desk.example')
    social(handle[:-1] if len(handle)>2 else handle+'x',b,'Personal fan page; not affiliated.')
    social('cityphotographer','City Photographer','Weekend landscapes')
    social('dailykitchen','Daily Kitchen','Recipes and food stories')
    social(handle+'_fans',b+' Fans','Unofficial community; not affiliated.',brand['website'])
    social(handle+'_giveaway',b,'Claim reward payment today','https://giveaway-zone.example')
    social(handle+'_security',b+' Security','Official account login verify','https://secure-check.example',brand['logo'])
    social('northwind_hiking','Northwind Hiking','Independent outdoor journal')
    social(handle+'_press',b+' Press','Independent news coverage.')
    social('garden_diary','Garden Diary','Home plants and flowers')
    if brand['apps']:
        app(official['name'],official['developer'],'Official mobile application',brand['website'],official['package'],brand['logo'])
    app(b+' Rewards Pro','Rewards Corporation','Official '+b+' reward login verify',shared,'com.rewards.pro',brand['logo'])
    app(b+' Support','Help Services','Official '+b+' customer care','https://support-desk.example','com.help.support',brand['logo'])
    app(b, 'Unknown Publisher','Shop with '+b,'','com.copy.brand',brand['logo'])
    app(b+' Plus','Mobile Studio',b+' mobile shopping service','','com.mobile.plus')
    app('Garden Planner','Garden Collective','Plan your vegetable garden','','org.garden.planner')
    app('Weather Notebook','Open Weather Lab','Local weather observations','','org.weather.notes')
    app(official['name']+' Lite',official['developer'],'Companion utility by a known publisher','','com.publisher.lite')
    app(b+' Login','Secure Account Ltd','Verify your '+b+' password','https://secure-check.example','com.verify.login',brand['logo'])
    app('Community Notebook','Community Tools','Personal notebooks','','org.community.notes')
    app(b+' Fans','Fan Community','Unofficial '+b+' community; not affiliated.','','org.fans.community')
    app('Trail Compass','Trail Guides','Offline hiking compass','','org.trail.compass')
    return [Candidate(brand_id=brand['id'],**r).model_dump() for r in rows]
