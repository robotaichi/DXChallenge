// ==UserScript==
// @name         筑波大学TORIOSスクレイピング
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  TRIOSから教員名と職名をウェブスクレイピングし、consoleにcsv形式として表示します。
// @author       You
// @match        https://trios.tsukuba.ac.jp/ja/researchers/by_affiliation/*
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function() {
    'use strict';

    var csvData = GM_getValue('csvData', []); // CSVデータのグローバルスコープでの定義
    var isScrapingStarted = GM_getValue('isScrapingStarted', false); // スクレイピングがアクティブかどうかのフラグを取得
    GM_setValue('showStartButton', true);

    // ローディングインジケーターを表示する関数
    function showLoadingIndicator() {
        // インジケーターが既に存在する場合は何もしない
        if (document.getElementById('loadingIndicator')) return;

        // インジケーター用のdivを作成
        var loadingDiv = document.createElement('div');
        loadingDiv.id = 'loadingIndicator';
        loadingDiv.style.position = 'fixed';
        loadingDiv.style.top = '50%';
        loadingDiv.style.left = '50%';
        loadingDiv.style.transform = 'translate(-50%, -50%)';
        loadingDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        loadingDiv.style.color = 'white';
        loadingDiv.style.padding = '20px';
        loadingDiv.style.borderRadius = '5px';
        loadingDiv.style.zIndex = '1000';
        loadingDiv.style.display = 'flex';
        loadingDiv.style.flexDirection = 'column';
        loadingDiv.style.alignItems = 'center';
        loadingDiv.style.justifyContent = 'center';

        // テキストを追加
        var text = document.createElement('div');
        text.innerText = 'ウェブスクレイピング中...';
        loadingDiv.appendChild(text);

        // ローディングアニメーション用のスピナーを追加
        var spinner = document.createElement('div');
        spinner.style.border = '4px solid #f3f3f3';
        spinner.style.borderRadius = '50%';
        spinner.style.borderTop = '4px solid #3498db';
        spinner.style.width = '40px';
        spinner.style.height = '40px';
        spinner.style.animation = 'spin 2s linear infinite';
        loadingDiv.appendChild(spinner);

        // @keyframesのスタイルを追加
        var style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
        document.head.appendChild(style);

        // ページにインジケーターを追加
        document.body.appendChild(loadingDiv);
    }

    // ローディングインジケーターを非表示にする関数
    function hideLoadingIndicator() {
        var loadingDiv = document.getElementById('loadingIndicator');
        if (loadingDiv) {
            loadingDiv.parentNode.removeChild(loadingDiv);
        }
    }

    function scrapeCurrentPage() {
        var rows = document.querySelectorAll('tr');
        rows.forEach(function(row) {
            var cells = row.querySelectorAll('td');
            if (cells.length > 0) {
                var name = cells[0].textContent.replace(/\(.*?\)/, '').trim();
                var affiliation = cells[1].textContent.trim();
                var position = cells[2].textContent.trim();
                csvData.push([`${name}`, `${position}`, "", `${affiliation}`].join(';'));
            }
        });
        // 更新されたCSVデータを保存
        GM_setValue('csvData', csvData);
    }

    function outputCsvData() {
        hideLoadingIndicator();
        // 区切り文字をコンマに変更
        var csvString = csvData.join('\n').replace(/;/g, ',');
        var bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
        var blob = new Blob([bom, csvString], {type: 'text/csv;charset=utf-8;'});

        var csvUrl = URL.createObjectURL(blob);

        // ダウンロードリンクを作成
        var downloadLink = document.createElement("a");
        document.body.appendChild(downloadLink);
        downloadLink.href = csvUrl;
        downloadLink.download = "researchers.csv"; // ファイル名を指定
        downloadLink.click();
        document.body.removeChild(downloadLink);

        // CSVデータの出力後、ストレージをクリア
        GM_setValue('csvData', []);
        GM_setValue('isScrapingStarted', false);
    }

    //スクレイピングを開始
    function startScraping() {
        if (csvData.length === 0) {
            csvData.push(['教員名', '職名',　"他専攻名および学外の所属機関名", '所属（書き込まれません）'].join(';'));
        }

        showLoadingIndicator(); // スクレイピング開始時にローディングインジケーターを表示
        scrapeCurrentPage();// スクレイピング実行

        // 次のページがあれば自動遷移、なければCSVデータを出力
        setTimeout(function() {
            var nextPageLink = document.querySelector('a[rel="next"]');
            if (nextPageLink) {
                window.location.href = nextPageLink.href;
            } else {
                outputCsvData();
            }
        }, 5000);
    }

    // スクレイピングボタンを表示する関数
    function createStartButton() {
        var startButton = document.createElement('button');
        startButton.innerText = 'ウェブスクレイピングを実行';
        startButton.style.position = 'fixed';
        startButton.style.top = '50%';
        startButton.style.left = '50%';
        startButton.style.transform = 'translate(-50%, -50%)';
        startButton.style.zIndex = '1000';
        startButton.style.padding = '10px 20px';
        startButton.style.fontSize = '16px';
        startButton.style.cursor = 'pointer';

        startButton.onclick = function() {
            GM_setValue('isScrapingStarted', true);
            startButton.remove();
            startScraping();
        };

        document.body.appendChild(startButton);
    }

    startScraping();
})();