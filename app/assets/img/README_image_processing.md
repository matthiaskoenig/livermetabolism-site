Use imagemagix
https://www.howtogeek.com/109369/how-to-quickly-resize-convert-modify-images-from-the-linux-terminal/

```
convert adrian.png -resize 128x128 adrian_128.png
convert news.png -resize x60 news_60.png
```

Batch 
```
for file in *.png; do convert $file -resize 128x128 128/$file; done
for file in *.png; do convert $file -resize x60 60/$file; done
```
