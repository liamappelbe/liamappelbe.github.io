Deploying:

```shell
dart pub global activate webdev
rm -rf deploy
webdev build -o temp
mv temp/web deploy
rm deploy/packages
mv temp/packages deploy/packages
rm -rf temp
```
