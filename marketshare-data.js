// Market share data for marketshare.html, from StatCounter Global Stats.
//
// To update a chart: open its `source` page, set the date range, click
// "Download Data (.csv)", and paste the file's contents over its `csv` text.
// The period shown on the page is read from the CSV header.
//
// `colors` sets how bars are colored (see marketshare.js):
//   "browser" - each bar takes its browser's color (also used for browser versions)
//   "entity"  - each name gets its own color, the same in the US and Worldwide charts
//               (only for a few names, like Desktop / Mobile)
//   "#rrggbb" - one color for every bar in the section
window.MARKET_SHARE = [
  {
    id: "desktop-browsers",
    title: "Desktop browsers",
    colors: "browser",
    us: {
      source: "https://gs.statcounter.com/browser-market-share/desktop/united-states-of-america/#monthly-202607-202609-bar",
      csv: `
"Browser","Market Share Perc. (July - Sept 2026)"
"Chrome",62.25
"Edge",13.44
"Safari",11.93
"Firefox",7.74
"Opera",1.86
"Brave",1.23
"Samsung Internet",0.81
"Mozilla",0.55
"Yandex Browser",0.07
"360 Safe Browser",0.03
"IE",0.02
"Edge Legacy",0.01
"Other",0.05
`
    },
    ww: {
      source: "https://gs.statcounter.com/browser-market-share/desktop/worldwide/#monthly-202607-202609-bar",
      csv: `
"Browser","Market Share Perc. (July - Sept 2026)"
"Chrome",70.2
"Edge",11.8
"Safari",6.13
"Firefox",5.92
"Opera",2.09
"Samsung Internet",1.31
"Brave",0.93
"360 Safe Browser",0.46
"Yandex Browser",0.4
"Mozilla",0.22
"QQ Browser",0.17
"Coc Coc",0.16
"Sogou Explorer",0.06
"Pale Moon",0.04
"Whale Browser",0.04
"IE",0.02
"Edge Legacy",0.01
"Ecosia",0.01
"Other",0.03
`
    }
  },
  {
    id: "mobile-browsers",
    title: "Mobile browsers",
    colors: "browser",
    us: {
      source: "https://gs.statcounter.com/browser-market-share/mobile/united-states-of-america/#monthly-202607-202609-bar",
      csv: `
"Browser","Market Share Perc. (July - Sept 2026)"
"Safari",50.37
"Chrome",43.53
"Samsung Internet",2.86
"Firefox",1.37
"Opera",0.62
"Brave",0.42
"Edge",0.42
"Yandex Browser",0.13
"Unknown",0.07
"Ecosia",0.06
"UC Browser",0.06
"Android",0.04
"KaiOS",0.01
"Other",0.02
`
    },
    ww: {
      source: "https://gs.statcounter.com/browser-market-share/mobile/worldwide/#monthly-202607-202609-bar",
      csv: `
"Browser","Market Share Perc. (July - Sept 2026)"
"Chrome",66.87
"Safari",25.34
"Samsung Internet",2.82
"Opera",1.71
"UC Browser",1.1
"Firefox",0.7
"Edge",0.4
"Brave",0.26
"Yandex Browser",0.21
"QQ Browser",0.19
"Coc Coc",0.11
"Whale Browser",0.08
"Ecosia",0.06
"Android",0.06
"Unknown",0.05
"Instabridge",0.02
"KaiOS",0.01
"Other",0.02
`
    }
  },
  {
    id: "desktop-browser-versions",
    title: "Desktop browser versions",
    colors: "browser",
    us: {
      source: "https://gs.statcounter.com/browser-version-market-share/desktop/united-states-of-america/#monthly-202607-202609-bar",
      csv: `
"Browser Version","Market Share Perc. (July - Sept 2026)"
"Chrome 150.0",11.01
"Chrome 149.0",9.86
"Chrome 151.0",9.63
"Chrome for Android",7.44
"Chrome 152.0",5.85
"Edge 150",3.97
"Edge 151",3.67
"Chrome 153.0",3.49
"Safari 26.5",3.46
"Safari 26.6",2.75
"Edge 153",1.88
"Edge 152",1.68
"Chrome 136.0",1.57
"Chrome 145.0",1.26
"Brave 0",1.23
"Chrome 148.0",1.22
"Firefox 153.0",1.13
"Firefox 152.0",1.02
"Chrome 147.0",1
"Safari 17.6",0.9
"Edge 149",0.84
"Chrome 154.0",0.81
"Chrome 125.0",0.76
"Chrome 146.0",0.72
"Chrome 144.0",0.7
"Safari 18.6",0.68
"Samsung Internet 30.0",0.68
"Chrome 139.0",0.63
"Firefox 154.0",0.57
"Mozilla 0",0.55
"Firefox 155.0",0.52
"Chrome 109.0",0.49
"Safari 16.6",0.48
"Edge 154",0.46
"Firefox 156.0",0.46
"Opera 133.0",0.45
"Chrome 131.0",0.42
"Chrome 138.0",0.42
"Chrome 142.0",0.41
"Chrome 124.0",0.38
"Safari 17.1",0.37
"Safari 18.7",0.36
"Firefox 135.0",0.35
"Chrome 120.0",0.33
"Opera 135.0",0.28
"Safari 26.3",0.28
"Firefox 115.0",0.27
"Firefox 136.0",0.26
"Safari 17.5",0.25
"Firefox 133.0",0.25
"Firefox 132.0",0.25
"Opera 134.0",0.24
"Safari 17.4",0.24
"Chrome 116.0",0.23
"Firefox 125.0",0.23
"Firefox 127.0",0.22
"Firefox 131.0",0.22
"Safari 15.6",0.22
"Safari 537.36",0.22
"Safari 26.4",0.21
"Firefox 126.0",0.21
"Firefox 130.0",0.21
"Chrome 143.0",0.2
"Chrome 103.0",0.2
"Chrome 133.0",0.2
"Safari 26.2",0.2
"Chrome 119.0",0.19
"Firefox 128.0",0.19
"Firefox 140.0",0.18
"Chrome 128.0",0.17
"Opera 132.0",0.16
"Firefox 121.0",0.15
"Safari 27.0",0.15
"Firefox 129.0",0.14
"Firefox 134.0",0.14
"Chrome 126.0",0.13
"Firefox 150.0",0.12
"Edge 120",0.12
"Safari 18.1",0.12
"Firefox 120.0",0.11
"Chrome 118.0",0.11
"Safari 18.5",0.11
"Safari 18.3",0.1
"Chrome 122.0",0.1
"Chrome 70.0",0.1
"Opera 100.0",0.09
"Chrome 140.0",0.09
"Chrome 137.0",0.09
"Opera 89.0",0.08
"Opera 90.0",0.08
"Opera 91.0",0.08
"Edge 119",0.08
"Edge 109",0.08
"Chrome 130.0",0.08
"Chrome 141.0",0.08
"Chrome 134.0",0.07
"Edge 148",0.07
"Chrome 132.0",0.07
"Firefox 151.0",0.07
"Edge 146",0.07
"Safari 13.1",0.07
"Firefox 123.0",0.07
"Safari 14.1",0.06
"Safari 17.3",0.06
"Chrome 127.0",0.06
"Firefox 147.0",0.06
"Chrome 135.0",0.06
"Safari 17.2",0.06
"Chrome 123.0",0.06
"Chrome 112.0",0.05
"Edge 144",0.05
"Safari 26.1",0.05
"Chrome 117.0",0.05
"Edge 124",0.05
"Edge 131",0.05
"Chrome 48.0",0.05
"Safari 604.1",0.05
"Chrome 129.0",0.05
"Chrome 111.0",0.05
"Opera 95.0",0.05
"Firefox 124.0",0.04
"Chrome 108.0",0.04
"Chrome 106.0",0.04
"Chrome 114.0",0.04
"Safari 16.5",0.04
"Chrome 104.0",0.04
"Chrome 110.0",0.04
"Edge 133",0.04
"Chrome 105.0",0.04
"Chrome 107.0",0.04
"Edge 147",0.04
"Chrome 49.0",0.04
"Safari 17.0",0.04
"Safari 26.0",0.04
"Safari 18.4",0.04
"Edge 122",0.04
"Safari 605.1",0.04
"Opera 106.0",0.04
"Opera 131.0",0.04
"Safari 16.3",0.04
"Chrome 52.0",0.03
"Yandex Browser 26.6",0.03
"Safari 14.0",0.03
"Opera 136.0",0.03
"Chrome 102.0",0.03
"Chrome 47.0",0.03
"Samsung Internet 29.0",0.03
"Chrome 59.0",0.03
"Chrome 58.0",0.03
"Chrome 53.0",0.03
"Chrome 56.0",0.03
"360 Safe Browser 0",0.03
"Chrome 41.0",0.03
"Chrome 57.0",0.03
"Chrome 51.0",0.03
"Chrome 60.0",0.03
"Chrome 55.0",0.03
"Chrome 43.0",0.03
"Chrome 44.0",0.03
"Chrome 42.0",0.03
"Chrome 54.0",0.03
"Chrome 40.0",0.03
"Chrome 50.0",0.03
"Chrome 39.0",0.03
"Chrome 45.0",0.03
"Chrome 46.0",0.03
"Firefox 148.0",0.03
"Chrome 121.0",0.03
"Safari 18.2",0.03
"Samsung Internet 28.0",0.03
"Edge 145",0.03
"Chrome 87.0",0.03
"Chrome 93.0",0.03
"Chrome 115.0",0.03
"Firefox 11.0",0.03
"Safari 16.1",0.02
"Safari 18.0",0.02
"Firefox 149.0",0.02
"Safari 16.4",0.02
"Edge 143",0.02
"Chrome 99.0",0.02
"Chrome 74.0",0.02
"Opera 107.0",0.02
"Firefox 78.0",0.02
"Opera 105.0",0.02
"Edge 140",0.02
"Edge 142",0.02
"Chrome 101.0",0.02
"Chrome 79.0",0.02
"IE 11.0",0.02
"Firefox 157.0",0.02
"Yandex Browser 26.8",0.02
"Safari 16.2",0.02
"Edge 138",0.02
"Firefox 52.0",0.02
"Opera 101.0",0.02
"Edge 139",0.02
"Edge 132",0.01
"Opera 99.0",0.01
"Opera 113.0",0.01
"Edge 123",0.01
"Chrome 155.0",0.01
"Edge 141",0.01
"Firefox 146.0",0.01
"Safari 15.5",0.01
"Chrome 80.0",0.01
"Firefox 139.0",0.01
"Edge 135",0.01
"Firefox 142.0",0.01
"Firefox 143.0",0.01
"Edge 134",0.01
"Firefox 144.0",0.01
"Safari 15.3",0.01
"Chrome 91.0",0.01
"Safari 16.0",0.01
"Opera 122.0",0.01
"Chrome 113.0",0.01
"Edge 128",0.01
"Samsung Internet 27.0",0.01
"Safari 12.1",0.01
"Safari 15.4",0.01
"Other",0.66
`
    },
    ww: {
      source: "https://gs.statcounter.com/browser-version-market-share/desktop/worldwide/#monthly-202607-202609-bar",
      csv: `
"Browser Version","Market Share Perc. (July - Sept 2026)"
"Chrome for Android",17.21
"Chrome 150.0",10.63
"Chrome 151.0",8.82
"Chrome 149.0",5.38
"Chrome 152.0",5.2
"Chrome 153.0",4.12
"Chrome 145.0",3.9
"Edge 150",3.28
"Edge 151",2.96
"Safari 26.5",1.84
"Edge 153",1.54
"Safari 26.6",1.45
"Edge 152",1.41
"Chrome 109.0",1.28
"Samsung Internet 30.0",1.05
"Chrome 120.0",1.03
"Chrome 148.0",0.98
"Chrome 154.0",0.94
"Brave 0",0.93
"Firefox 153.0",0.9
"Firefox 152.0",0.86
"Chrome 119.0",0.79
"Firefox 121.0",0.76
"Edge 149",0.71
"Chrome 142.0",0.58
"Opera 133.0",0.57
"Chrome 144.0",0.49
"Chrome 131.0",0.49
"Chrome 118.0",0.49
"Firefox 154.0",0.48
"360 Safe Browser 0",0.46
"Chrome 136.0",0.43
"Chrome 147.0",0.42
"Firefox 155.0",0.42
"Firefox 156.0",0.42
"Edge 120",0.4
"Chrome 133.0",0.4
"Edge 154",0.4
"Opera 135.0",0.39
"Chrome 116.0",0.39
"Firefox 120.0",0.39
"Edge 119",0.38
"Chrome 146.0",0.37
"Safari 17.6",0.32
"Safari 18.6",0.32
"Chrome 124.0",0.31
"Chrome 138.0",0.3
"Chrome 103.0",0.29
"Firefox 115.0",0.28
"Chrome 125.0",0.28
"Opera 134.0",0.27
"Safari 16.6",0.25
"Safari 18.7",0.24
"Chrome 139.0",0.24
"Chrome 137.0",0.23
"Mozilla 0",0.22
"Opera 100.0",0.21
"Firefox 135.0",0.21
"Safari 17.1",0.21
"Chrome 132.0",0.2
"Chrome 111.0",0.19
"Opera 132.0",0.19
"Chrome 108.0",0.17
"Yandex Browser 26.6",0.17
"Chrome 117.0",0.17
"Firefox 140.0",0.17
"Chrome 110.0",0.17
"Chrome 112.0",0.17
"Chrome 106.0",0.16
"Chrome 105.0",0.16
"Chrome 107.0",0.16
"Chrome 104.0",0.16
"Safari 26.3",0.16
"Safari 15.6",0.15
"Chrome 141.0",0.13
"Yandex Browser 26.8",0.13
"Chrome 143.0",0.12
"Chrome 140.0",0.12
"Safari 26.4",0.12
"Chrome 128.0",0.12
"Safari 26.2",0.12
"Chrome 70.0",0.11
"Chrome 134.0",0.11
"Chrome 135.0",0.1
"Safari 27.0",0.1
"Safari 17.5",0.09
"Chrome 122.0",0.08
"Chrome 126.0",0.08
"Firefox 133.0",0.08
"Edge 148",0.08
"Samsung Internet 29.0",0.08
"Coc Coc 155.0",0.07
"Safari 17.4",0.07
"Firefox 136.0",0.07
"Opera 136.0",0.07
"Safari 18.5",0.07
"Edge 109",0.07
"Safari 537.36",0.06
"Sogou Explorer 0",0.06
"Firefox 132.0",0.06
"Opera 95.0",0.06
"Chrome 130.0",0.06
"Safari 18.3",0.06
"Firefox 125.0",0.06
"Samsung Internet 28.0",0.06
"Firefox 127.0",0.06
"Firefox 131.0",0.05
"Opera 131.0",0.05
"Firefox 128.0",0.05
"Firefox 130.0",0.05
"Firefox 126.0",0.05
"Firefox 151.0",0.05
"Firefox 150.0",0.05
"Edge 147",0.05
"Safari 18.1",0.05
"Chrome 48.0",0.05
"Edge 146",0.05
"Chrome 49.0",0.05
"Chrome 123.0",0.04
"Chrome 69.0",0.04
"Pale Moon 33.6",0.04
"Chrome 98.0",0.04
"Yandex Browser 24.10",0.04
"Chrome 53.0",0.04
"Chrome 52.0",0.04
"Chrome 121.0",0.04
"Firefox 134.0",0.04
"Chrome 60.0",0.04
"Chrome 58.0",0.04
"Chrome 56.0",0.04
"Chrome 55.0",0.04
"Chrome 57.0",0.04
"Chrome 47.0",0.04
"Safari 14.1",0.04
"Chrome 59.0",0.04
"Firefox 129.0",0.04
"Chrome 51.0",0.04
"Chrome 41.0",0.04
"Chrome 45.0",0.04
"Chrome 50.0",0.04
"Chrome 54.0",0.04
"Chrome 40.0",0.04
"Chrome 43.0",0.04
"Chrome 42.0",0.04
"Chrome 44.0",0.04
"Chrome 39.0",0.04
"Chrome 87.0",0.04
"Chrome 46.0",0.04
"Chrome 114.0",0.03
"Edge 131",0.03
"Chrome 127.0",0.03
"Edge 144",0.03
"Yandex Browser 26.4",0.03
"Safari 605.1",0.03
"Chrome 79.0",0.03
"Safari 26.1",0.03
"Coc Coc 156.0",0.03
"Safari 13.1",0.03
"Safari 26.0",0.03
"Edge 145",0.03
"Firefox 147.0",0.03
"Edge 143",0.03
"Safari 17.3",0.03
"Safari 604.1",0.03
"Opera 99.0",0.02
"Opera 101.0",0.02
"Edge 122",0.02
"Chrome 129.0",0.02
"Safari 18.4",0.02
"QQ Browser 20.4",0.02
"Firefox 123.0",0.02
"Edge 138",0.02
"Safari 16.3",0.02
"Whale Browser 4.39",0.02
"Opera 90.0",0.02
"Chrome 93.0",0.02
"Opera 89.0",0.02
"Edge 142",0.02
"Chrome 115.0",0.02
"Edge 133",0.02
"Chrome 101.0",0.02
"Opera 91.0",0.02
"Edge 140",0.02
"Coc Coc 154.0",0.02
"Safari 17.2",0.02
"Samsung Internet 27.0",0.02
"Safari 16.5",0.02
"QQ Browser 20.3",0.02
"Edge 92",0.02
"Edge 141",0.02
"Firefox 149.0",0.02
"Chrome 102.0",0.02
"Whale Browser 4.38",0.02
"Safari 18.2",0.02
"Firefox 148.0",0.02
"Edge 139",0.02
"Safari 17.0",0.02
"Edge 124",0.02
"Firefox 52.0",0.02
"Chrome 155.0",0.02
"QQ Browser 20.5",0.02
"Firefox 124.0",0.02
"Safari 16.1",0.02
"Samsung Internet 25.0",0.01
"Safari 18.0",0.01
"Firefox 157.0",0.01
"Safari 14.0",0.01
"Edge 135",0.01
"Samsung Internet 8.0",0.01
"IE 11.0",0.01
"Chrome 91.0",0.01
"Opera 106.0",0.01
"Chrome 97.0",0.01
"Edge 136",0.01
"Firefox 146.0",0.01
"Samsung Internet 3.0",0.01
"Edge 137",0.01
"Firefox 5.0",0.01
"Chrome 86.0",0.01
"Safari 16.2",0.01
"Chrome 99.0",0.01
"Safari 16.4",0.01
"Edge 134",0.01
"Coc Coc 157.0",0.01
"Edge 132",0.01
"Edge 114",0.01
"Firefox 78.0",0.01
"Other",0.9
`
    }
  },
  {
    id: "ios-versions",
    title: "iOS versions",
    colors: "#199e70",
    us: {
      source: "https://gs.statcounter.com/ios-version-market-share/mobile/united-states-of-america/#monthly-202607-202609-bar",
      csv: `
"iOS Version","Market Share Perc. (July - Sept 2026)"
"iOS 26.5",39.39
"iOS 26.6",35.87
"iOS 18.7",10.06
"iOS 26.3",1.83
"iOS 26.2",1.43
"iOS 18.6",1.36
"iOS 26.4",1.31
"iOS 27",0.91
"iOS 18.5",0.88
"iOS 16.7",0.84
"iOS 18.3",0.58
"iOS 17.6",0.55
"iOS 26.1",0.45
"iOS 27.0",0.43
"iOS 15.8",0.42
"iOS 11.0",0.33
"iOS 18.1",0.31
"iOS 18.4",0.29
"iOS 17.5",0.27
"iOS 26",0.25
"iOS 18.2",0.24
"iOS 26.7",0.19
"iOS 16.6",0.14
"iOS 26.0",0.13
"iOS 17.4",0.13
"iOS 18.0",0.12
"iOS 17.3",0.1
"iOS 17.7",0.1
"iOS 16.1",0.09
"iOS 16.3",0.09
"iOS 17.2",0.07
"iOS 15.6",0.07
"iOS 17.1",0.06
"iOS 16.2",0.05
"iOS 16.5",0.05
"iOS 16.0",0.04
"iOS 27.2",0.04
"iOS 12.5",0.04
"iOS 16.4",0.03
"iOS 15.5",0.03
"iOS 17.0",0.03
"iOS 15.7",0.03
"iOS 13.2",0.03
"iOS 14.7",0.03
"iOS 15.4",0.02
"iOS 15.0",0.02
"iOS 14.4",0.02
"iOS 14.8",0.02
"iOS 14.6",0.02
"iOS 15.1",0.02
"iOS 11.3",0.02
"iOS 15.3",0.01
"iOS 14.2",0.01
"iOS 15.2",0.01
"iOS 14.3",0.01
"Other",0.11
`
    },
    ww: {
      source: "https://gs.statcounter.com/ios-version-market-share/mobile/worldwide/#monthly-202607-202609-bar",
      csv: `
"iOS Version","Market Share Perc. (July - Sept 2026)"
"iOS 26.5",35.91
"iOS 26.6",29.72
"iOS 18.7",10.39
"iOS 26.3",2.41
"iOS 26.2",2.13
"iOS 18.6",1.93
"iOS 26.4",1.92
"iOS 16.7",1.76
"iOS 18.5",1.52
"iOS 15.8",1.24
"iOS 27",1.06
"iOS 18.3",0.93
"iOS 17.6",0.81
"iOS 26.1",0.8
"iOS 27.0",0.75
"iOS 11.0",0.65
"iOS 18.1",0.51
"iOS 18.4",0.5
"iOS 17.5",0.47
"iOS 18.2",0.43
"iOS 26",0.42
"iOS 26.0",0.36
"iOS 18.0",0.27
"iOS 17.4",0.24
"iOS 16.6",0.23
"iOS 26.7",0.23
"iOS 16.3",0.22
"iOS 16.1",0.21
"iOS 17.7",0.17
"iOS 17.3",0.16
"iOS 16.0",0.12
"iOS 17.1",0.12
"iOS 17.2",0.11
"iOS 15.6",0.11
"iOS 16.2",0.11
"iOS 12.5",0.11
"iOS 15.7",0.1
"iOS 16.5",0.09
"iOS 17.0",0.09
"iOS 15.5",0.07
"iOS 15.4",0.06
"iOS 16.4",0.06
"iOS 15.0",0.05
"iOS 13.2",0.04
"iOS 10.3",0.04
"iOS 27.2",0.04
"iOS 15.3",0.03
"iOS 14.4",0.02
"iOS 15.1",0.02
"iOS 15.2",0.02
"iOS 14.7",0.02
"iOS 14.8",0.02
"iOS 14.6",0.02
"iOS 11.3",0.02
"iOS 4.3",0.02
"iOS 14.2",0.01
"iOS 13.6",0.01
"iOS 9.1",0.01
"Other",0.11
`
    }
  },
  {
    id: "android-versions",
    title: "Android versions",
    colors: "#008300",
    us: {
      source: "https://gs.statcounter.com/android-version-market-share/mobile/united-states-of-america/#monthly-202607-202609-bar",
      csv: `
"Android Version","Market Share Perc. (July - Sept 2026)"
"16.0",43.36
"13.0",12.67
"15.0",10.81
"14.0",9.44
"12.0",7.47
"11.0",5.54
"17.0",3.74
"10.0",2.78
"9.0 Pie",1.4
"8.0 Oreo",0.83
"6.0 Marshmallow",0.57
"5.0 Lollipop",0.48
"8.1 Oreo",0.45
"7.0 Nougat",0.16
"7.1 Nougat",0.1
"12.2",0.08
"26.6",0.03
"5.1 Lollipop",0.02
"12.1",0.02
"26.8",0.01
"Other",0.04
`
    },
    ww: {
      source: "https://gs.statcounter.com/android-version-market-share/mobile/worldwide/#monthly-202607-202609-bar",
      csv: `
"Android Version","Market Share Perc. (July - Sept 2026)"
"16.0",29.84
"15.0",16.93
"13.0",13.82
"14.0",12.65
"12.0",9.32
"11.0",7.52
"10.0",3.97
"9.0 Pie",1.81
"17.0",1.03
"8.1 Oreo",1.02
"8.0 Oreo",0.6
"6.0 Marshmallow",0.58
"5.0 Lollipop",0.36
"7.1 Nougat",0.15
"7.0 Nougat",0.15
"5.1 Lollipop",0.1
"12.2",0.04
"26.6",0.03
"26.8",0.02
"4.4 KitKat",0.02
"20.1",0.01
"4.1 Jelly Bean",0.01
"Other",0.03
`
    }
  },
  {
    id: "mobile-vendors",
    title: "Mobile device vendors",
    colors: "#d95926",
    us: {
      source: "https://gs.statcounter.com/vendor-market-share/mobile/united-states-of-america/#monthly-202607-202609-bar",
      csv: `
"Device Vendor","Market Share Perc. (July - Sept 2026)"
"Apple",57.86
"Samsung",24.07
"Xiaomi",5
"Motorola",3.87
"Unknown",3.21
"Google",2.94
"Huawei",0.4
"OnePlus",0.37
"Vivo",0.36
"Realme",0.3
"Oppo",0.27
"Infinix",0.23
"Honor",0.2
"Tecno",0.18
"T-Mobile",0.15
"LG",0.14
"Nokia",0.07
"TCL",0.05
"Lenovo",0.04
"Blu",0.04
"Daria",0.03
"Kyocera",0.03
"Itel",0.03
"Nothing",0.02
"ZTE",0.02
"AT&T",0.02
"Sony",0.02
"Cricket",0.01
"Vocal",0.01
"Other",0.08
`
    },
    ww: {
      source: "https://gs.statcounter.com/vendor-market-share/mobile/worldwide/#monthly-202607-202609-bar",
      csv: `
"Device Vendor","Market Share Perc. (July - Sept 2026)"
"Apple",31.58
"Samsung",20.75
"Xiaomi",10.55
"Unknown",8.76
"Oppo",5.7
"Vivo",5.68
"Motorola",3.63
"Realme",3.58
"Huawei",1.52
"OnePlus",1.5
"Google",1.5
"Infinix",1.49
"Honor",1.38
"Tecno",1.13
"Itel",0.21
"Nothing",0.17
"Nokia",0.13
"Lenovo",0.11
"Sony",0.11
"ZTE",0.1
"LG",0.09
"Asus",0.05
"TCL",0.04
"T-Mobile",0.03
"Lava",0.03
"BBK",0.01
"Daria",0.01
"Other",0.18
`
    }
  },
  {
    id: "desktop-vs-mobile",
    title: "Desktop vs mobile",
    colors: "entity",
    us: {
      source: "https://gs.statcounter.com/platform-market-share/desktop-mobile/united-states-of-america/#monthly-202607-202609-bar",
      csv: `
"Platform Comparison","Market Share Perc. (July - Sept 2026)"
"Desktop",54
"Mobile",46
`
    },
    ww: {
      source: "https://gs.statcounter.com/platform-market-share/desktop-mobile/worldwide/#monthly-202607-202609-bar",
      csv: `
"Platform Comparison","Market Share Perc. (July - Sept 2026)"
"Mobile",54.23
"Desktop",45.77
`
    }
  },
  {
    id: "desktop-resolution",
    title: "Desktop screen resolutions",
    colors: "#9085e9",
    us: {
      source: "https://gs.statcounter.com/screen-resolution-stats/desktop/united-states-of-america/#monthly-202607-202609-bar",
      csv: `
"Screen Resolution","Market Share Perc. (July - Sept 2026)"
"1920x1080",28
"1280x720",6.49
"1536x864",6.2
"800x600",4.92
"1366x768",4.66
"2560x1440",3.47
"1440x900",3.31
"384x832",2.82
"1920x1200",2.03
"1280x800",1.86
"1470x956",1.79
"1536x960",1.64
"1600x900",1.5
"820x1180",1.14
"1512x982",1.08
"360x780",1.01
"810x1080",0.93
"1680x1050",0.91
"3440x1440",0.75
"1280x1200",0.73
"Other",24.77
`
    },
    ww: {
      source: "https://gs.statcounter.com/screen-resolution-stats/desktop/worldwide/#monthly-202607-202609-bar",
      csv: `
"Screen Resolution","Market Share Perc. (July - Sept 2026)"
"1920x1080",23.72
"1536x864",7.77
"1366x768",6.01
"1280x720",4.48
"1366x1366",3.82
"384x832",3.4
"1280x1200",3.02
"2560x1440",2.97
"1440x900",2.25
"800x600",1.96
"360x800",1.78
"1280x800",1.54
"1600x900",1.45
"1536x960",1.08
"385x854",1.04
"360x820",0.9
"1470x956",0.88
"360x780",0.87
"1920x1200",0.83
"375x812",0.8
"Other",29.44
`
    }
  },
  {
    id: "social-mobile",
    title: "Social media (mobile)",
    colors: "#d55181",
    us: {
      source: "https://gs.statcounter.com/social-media-stats/mobile/united-states-of-america/#monthly-202607-202609-bar",
      csv: `
"Social Media","Market Share Perc. (July - Sept 2026)"
"Facebook",71.61
"Twitter",13.53
"Instagram",5.94
"reddit",3.35
"Pinterest",3.31
"YouTube",1.94
"LinkedIn",0.19
"Fark",0.05
"Tumblr",0.04
"news.ycombinator.com",0.02
"Other",0
`
    },
    ww: {
      source: "https://gs.statcounter.com/social-media-stats/mobile/worldwide/#monthly-202607-202609-bar",
      csv: `
"Social Media","Market Share Perc. (July - Sept 2026)"
"Facebook",76.76
"Instagram",8.03
"YouTube",6.43
"Twitter",5.89
"Pinterest",1.34
"reddit",1.32
"LinkedIn",0.16
"Tumblr",0.04
"news.ycombinator.com",0.01
"Fark",0.01
"Other",0
`
    }
  },
  {
    id: "social-desktop",
    title: "Social media (desktop)",
    colors: "#d55181",
    us: {
      source: "https://gs.statcounter.com/social-media-stats/desktop/united-states-of-america/#monthly-202607-202609-bar",
      csv: `
"Social Media","Market Share Perc. (July - Sept 2026)"
"Facebook",43.6
"Twitter",19.49
"Pinterest",16.75
"reddit",7.41
"YouTube",7.13
"LinkedIn",2.46
"Tumblr",1.27
"Instagram",1.26
"Fark",0.43
"news.ycombinator.com",0.18
"Other",0.02
`
    },
    ww: {
      source: "https://gs.statcounter.com/social-media-stats/desktop/worldwide/#monthly-202607-202609-bar",
      csv: `
"Social Media","Market Share Perc. (July - Sept 2026)"
"Facebook",35.34
"YouTube",24.23
"Twitter",14.79
"Pinterest",12.56
"reddit",6.21
"LinkedIn",3.64
"Instagram",1.67
"Tumblr",1.15
"Fark",0.18
"news.ycombinator.com",0.17
"VKontakte",0.05
"Other",0.02
`
    }
  }
];
