# Cloudflare Tunnel

This document describes how to setup the skies-adsb app so it is accessible securely on the Internet via the Cloudflare Tunnel service.

note: This document assumes that you have already setup skies-adsb and it is working on your RPI via your local network.

## 1. Login or Sign Up For a Cloudflare Account

Go here and login or sign up for Cloudflare:

https://www.cloudflare.com/

## 2. Either register or transfer existing domain to Cloudflare

You must either transfer an existing domain to Cloudflare or register one through the Cloudflare registrar.

```
Login -> Registrar
```

for purposes of this document I will assume your domain is:

```
yourdomain.com
```

## 3. Install cloudflared package on RPI

Download cloudflared package from here:

https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/

For RPI 32 bit copy the the .deb ARM download link (or the binary link)
For RPI 64-bit copy the .dev ARM64 download link

## 3a. RPI 64-bit instructions

Open a terminal to your RPI and install the cloudflared package:

```
ssh pi@raspberrypi.local
curl -LO https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb
sudo apt install ./cloudflared-linux-arm64.deb
```

## 3b. RPI 32-bit instructions

Open a terminal to your RPI and install the cloudflared package:

.deb install:

```
ssh pi@raspberrypi.local
curl -LO https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm.deb
sudo dpkg -i --force-architecture cloudflared-linux-arm.deb
```

Binary install:

```
ssh pi@raspberrypi.local
curl -LO https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm
chmod +x cloudflared-linux-arm
```

## 4. Create Cloudflare Tunnel

first Login to cloudflared:

```
ssh pi@raspberrypi.local
cloudflared tunnel login
```

a link will be displayed in the terminal. Open that link with a web browser. Login and your login credentials will be stored on the RPI.

now create a new Cloudflare Tunnel:

```
cloudflared tunnel create rpi
```

you should see output like this:

```
cloudflared tunnel create rpi
Tunnel credentials written to /home/pi/.cloudflared/6ff42ae2-765d-4adf-8112-31c55c1551ef.json. cloudflared chose this file based on where your origin certificate was found. Keep this file secret. To revoke these credentials, delete the tunnel.

Created tunnel rpi with id 6ff42ae2-765d-4adf-8112-31c55c1551ef
```

see: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/tunnel-guide/

## 5. Create dns entires for the app

```
ssh pi@raspberrypi.local
cloudflared tunnel route dns 6ff42ae2-765d-4adf-8112-31c55c1551ef rpi
cloudflared tunnel route dns 6ff42ae2-765d-4adf-8112-31c55c1551ef rpi-ws
cloudflared tunnel route dns 6ff42ae2-765d-4adf-8112-31c55c1551ef rpi-flask
```

see: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/routing-to-tunnel/dns/

# 6. Update skies-adsb installation to include the Cloudflare Tunnel URLs

You must now update your skies-adsb installation to include the Cloudflare Tunnel urls you just defined. Go to the location you built the skies-adsb app from and add the following entries to your src/.env file:

```
cd /path/to/skies-adsb/src
```

```
VITE_OPTIONAL_SKIES_CLOUDFLARE_HOSTNAME=rpi.yourdomain.com
VITE_OPTIONAL_SKIES_CLOUDFLARE_ADSB_HOST_URL=wss:rpi-ws.yourdomain.com
VITE_OPTIONAL_SKIES_CLOUDFLARE_FLASK_HOST_URL=https:rpi-flask.yourdomain.com
```

rebuild the skies-adsb app:

```
npm run build
```

and deploy again to your RPI:

```
./deploy.sh
```

now that your app routes have been setup and the skies-adsb app has been configured to recognize these routes you must create your cloudflared config.yaml file

# 7. Create cloudflared config.yaml and specify ingress rules

```
ssh pi@raspberrypi.local
cd .cloudflared
touch config.yaml
```

copy and paste the following text into the config.yaml file:

```
tunnel: 6ff42ae2-765d-4adf-8112-31c55c1551ef
credentials-file: /home/pi/.cloudflared/6ff42ae2-765d-4adf-8112-31c55c1551ef.json

ingress:
  - hostname: rpi.yourdomain.com
    service: http://localhost:80
  - hostname: rpi-ws.yourdomain.com
    service: ws://localhost:30006
  - hostname: rpi-flask.yourdomain.com
    service: http://localhost:5000
  - service: http_status:404
```

NOTE: replace the **UUID** values above with your own. Also replace yourdomain.com with your actual domain name.

For example the UUID above is:

```
6ff42ae2-765d-4adf-8112-31c55c1551ef
```

To learn more about the Cloudflare Tunnel Ingress rules go here: [Ingress Rules](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/configuration/local-management/ingress/)

# 8. Validate your config.yaml

```
ssh pi@raspberrypi.local
cloudflared tunnel ingress validate
```

you should see an OK message.

# 9. Test Run Cloudflare Tunnel

Enable the tunnel:

```
ssh pi@raspberrypi.local
cloudflared tunnel --loglevel debug run
```

Point your browser to:

rpi.yourdomain.com/skies-adsb

you should see the app up and running except for the air traffic. The websocket connection is not setup to serve secure websocket. For this we need to create a Cloudflare Application.

# 10. Create Cloudflare Application

Go here:

https://dash.teams.cloudflare.com/

```
Access -> Applications -> click on "Add an Application" -> select "Self-hosted"
```

Keep all the defaults (unless you know what you are doing) I am assuming a setup which will provide access control via a one-time PIN sent to any email address you specify in an access control list under the Cloudflare Application Policy section rules.

For "Application name" enter anything you like. One suggestion is:

```
rpi-adsb
```

keep the "Session Duration" at 24 hours.

For the Application domain enter the following:

```
Subdomain: rpi
Domain: yourdomain.com
Path: skies-adsb
```

click "Next" this will take you to the "Add policies" screen.

For a policy name you can re-use your "Applicaiton name". For example:

```
Policy name: rpi-adsb
```

Leave all the default values.

In the "Configure rules" pick the following:

```
Selector: Emails
Value: foo@bar.com, bar@foo.com, <any email you want to give access too>, etc...
```

Click "Next"

Now you will be in the final Setup form. You can leave the values as their defaults. And now click "Add application"

At this point you will be taking back to the Application main screen and you should see an entry for your application with an application url of:

```
rpi.yourdomain.com/skies-adsb
```

of type "SELF-HOSTED" with one assigned policy.

You are now ready to test your application.

# 11. Test your Cloudflare Application

Open a new incognito browser window to:

https://rpi.yourdomain.com/skies-adsb/

you should be presented with a landing page asking for your email. The email should be one from the list created the policy setup above.

Enter your email and click "Send me a code". You will be presented with another form asking you for a code. Check your email. Enter in the code you received. You should now see the skies-adsb app running with air traffic being displayed.
