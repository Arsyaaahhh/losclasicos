/**
 * =======================================================================
 * GOOGLE APPS SCRIPT BACKEND & DATABASE: losclasicos
 * =======================================================================
 * File: Code.gs
 * Fungsi:
 * 1. doPost(e): Menerima transaksi baru dari index.html (Nama, WA, Kata-kata,
 *    Bukti Pembayaran). Menyimpan gambar bukti transfer otomatis ke Google Drive
 *    dan mencatat data ke Google Sheets dengan LockService.
 * 2. doGet(e): Melayani admin.html dan index.html untuk:
 *    - get_settings: Ambil countdown & foto QRIS aktif
 *    - save_settings: Simpan countdown & foto QRIS baru
 *    - list: Ambil daftar siapa saja yang pesan
 *    - update: Ubah status pesanan (Sah / Batal)
 * =======================================================================
 */

var SHEET_NAME = "Transaksi";
var DRIVE_FOLDER_NAME = "Bukti Bayar losclasicos";

// Header Kolom Database Spreadsheet
var HEADERS = [
  "ID Transaksi",
  "Waktu Masuk",
  "Nama Pelanggan",
  "WhatsApp",
  "Kata-Kata Hari Ini",
  "Nominal (Rp)",
  "Bukti Pembayaran (Drive URL)",
  "Status Verifikasi",
  "Catatan Admin"
];

/**
 * Helper: Ambil atau buat Google Drive Folder untuk menampung gambar bukti bayar
 */
function getOrCreateDriveFolder() {
  var folders = DriveApp.getFoldersByName(DRIVE_FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  } else {
    var newFolder = DriveApp.createFolder(DRIVE_FOLDER_NAME);
    newFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return newFolder;
  }
}

/**
 * Helper: Ambil atau buat Sheet "Transaksi" dengan header rapi
 */
function getOrCreateSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    
    // Format Header Styling
    var headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#121212");
    headerRange.setFontColor("#FFFFFF");
    sheet.setFrozenRows(1);
    
    sheet.setColumnWidth(1, 110); // ID
    sheet.setColumnWidth(2, 170); // Waktu
    sheet.setColumnWidth(3, 160); // Nama
    sheet.setColumnWidth(4, 140); // WA
    sheet.setColumnWidth(5, 320); // Kata-Kata Hari Ini
    sheet.setColumnWidth(6, 120); // Nominal
    sheet.setColumnWidth(7, 280); // Bukti Drive URL
    sheet.setColumnWidth(8, 140); // Status
    sheet.setColumnWidth(9, 180); // Catatan
  }
  return sheet;
}

/**
 * Helper: Validasi Admin Token
 */
function isValidAdminToken(token) {
  var adminToken = PropertiesService.getScriptProperties().getProperty("ADMIN_TOKEN");
  if (!adminToken) {
    adminToken = "losclasicos2026";
  }
  return token && token === adminToken;
}

/**
 * Helper: Buat output JSON CORS
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * =======================================================================
 * 1. doPost(e) : SIMPAN TRANSAKSI BARU & SIMPAN BUKTI TRANSFER KE DRIVE
 * =======================================================================
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  
  try {
    lock.waitLock(15000);
    
    var sheet = getOrCreateSheet();
    var postData = (e && e.postData && e.postData.contents) ? e.postData.contents : "";
    
    if (!postData) {
      return createJsonResponse({
        status: "error",
        message: "Data payload kosong"
      });
    }
    
    var payload = JSON.parse(postData);
    var orderId = payload.id;
    if (!orderId) {
      var lastRow = sheet.getLastRow();
      orderId = "LC-" + ("0000" + lastRow).slice(-4);
    }
    
    var waktuOrder = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd'T'HH:mm:ssXXX");
    var fileUrl = "-";

    // Simpan Foto Bukti Bayar ke Google Drive jika ada Base64
    if (payload.buktiBayarBase64 && payload.buktiBayarBase64.indexOf("data:image") === 0) {
      try {
        var folder = getOrCreateDriveFolder();
        var parts = payload.buktiBayarBase64.split(",");
        var meta = parts[0];
        var base64Data = parts[1];
        
        var contentType = "image/jpeg";
        if (meta.indexOf("image/png") !== -1) contentType = "image/png";
        else if (meta.indexOf("image/webp") !== -1) contentType = "image/webp";

        var decoded = Utilities.base64Decode(base64Data);
        var blob = Utilities.newBlob(decoded, contentType, "Bukti_" + orderId + "_" + (payload.nama || "User").replace(/\s+/g, "_") + ".jpg");
        var file = folder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        fileUrl = file.getUrl();
      } catch (uploadErr) {
        fileUrl = "Upload gagal: " + uploadErr.toString();
      }
    }
    
    var rowData = [
      orderId,
      payload.waktu || waktuOrder,
      payload.nama || "",
      "'" + (payload.wa || ""),
      payload.kataKata || "",
      Number(payload.nominal) || 25000,
      fileUrl,
      payload.status || "Sudah Bayar",
      payload.catatan || "-"
    ];
    
    sheet.appendRow(rowData);
    
    return createJsonResponse({
      status: "success",
      id: orderId,
      buktiUrl: fileUrl,
      message: "Data pemesanan dan bukti pembayaran berhasil disimpan!"
    });
    
  } catch (err) {
    return createJsonResponse({
      status: "error",
      message: "Terjadi kesalahan: " + err.toString()
    });
  } finally {
    lock.releaseLock();
  }
}

/**
 * =======================================================================
 * 2. doGet(e) : API DASHBOARD & PENGATURAN TOKO
 * =======================================================================
 */
function doGet(e) {
  try {
    var params = e ? e.parameter : {};
    var action = params.action || "list";
    var token = params.token || "";
    
    // AKSI 1: Publik - Ambil Pengaturan Aktif (Countdown & Foto QRIS)
    if (action === "get_settings") {
      var props = PropertiesService.getScriptProperties();
      return createJsonResponse({
        status: "success",
        countdownDate: props.getProperty("COUNTDOWN_DATE") || "",
        qrisUrl: props.getProperty("QRIS_URL") || ""
      });
    }

    // Validasi token keamanan admin di level server untuk aksi-aksi berikutnya
    if (!isValidAdminToken(token)) {
      return createJsonResponse({
        status: "error",
        code: 401,
        message: "Akses ditolak: Password / Token Admin tidak valid!"
      });
    }
    
    // AKSI 2: Admin - Simpan Pengaturan (Countdown & Foto QRIS)
    if (action === "save_settings") {
      var props = PropertiesService.getScriptProperties();
      if (params.countdownDate) {
        props.setProperty("COUNTDOWN_DATE", params.countdownDate);
      }
      if (params.qrisUrl !== undefined) {
        props.setProperty("QRIS_URL", params.qrisUrl);
      }
      return createJsonResponse({
        status: "success",
        message: "Pengaturan countdown & QRIS berhasil disimpan di server!"
      });
    }

    var sheet = getOrCreateSheet();
    
    // Auth test
    if (action === "auth") {
      return createJsonResponse({
        status: "success",
        message: "Autentikasi token berhasil!"
      });
    }
    
    // AKSI 3: Ambil list semua transaksi (Siapa saja yang pesan)
    if (action === "list") {
      var lastRow = sheet.getLastRow();
      if (lastRow <= 1) {
        return createJsonResponse({
          status: "success",
          data: []
        });
      }
      
      var values = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
      var transactions = [];
      
      for (var i = 0; i < values.length; i++) {
        var row = values[i];
        var id = String(row[0] || "");
        if (!id) continue;
        
        transactions.push({
          id: id,
          waktu: row[1] ? String(row[1]) : "",
          nama: String(row[2] || ""),
          wa: String(row[3] || "").replace(/^'/, ""),
          kataKata: String(row[4] || ""),
          nominal: Number(row[5]) || 0,
          buktiUrl: String(row[6] || "-"),
          status: String(row[7] || "Sudah Bayar"),
          catatan: String(row[8] || "-")
        });
      }
      
      return createJsonResponse({
        status: "success",
        data: transactions
      });
    }
    
    // AKSI 4: Update status verifikasi transaksi
    if (action === "update") {
      var targetId = params.id;
      var newStatus = params.status;
      
      if (!targetId || !newStatus) {
        return createJsonResponse({
          status: "error",
          message: "Parameter 'id' dan 'status' wajib diisi!"
        });
      }
      
      var lastRow = sheet.getLastRow();
      if (lastRow <= 1) {
        return createJsonResponse({
          status: "error",
          message: "Database kosong"
        });
      }
      
      var idValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      var targetRow = -1;
      
      for (var j = 0; j < idValues.length; j++) {
        if (String(idValues[j][0]) === targetId) {
          targetRow = j + 2;
          break;
        }
      }
      
      if (targetRow === -1) {
        return createJsonResponse({
          status: "error",
          message: "Transaksi " + targetId + " tidak ditemukan!"
        });
      }
      
      // Update Kolom ke-8 (Status Verifikasi)
      sheet.getRange(targetRow, 8).setValue(newStatus);
      
      return createJsonResponse({
        status: "success",
        id: targetId,
        newStatus: newStatus,
        message: "Status transaksi " + targetId + " berhasil diubah ke " + newStatus
      });
    }
    
    return createJsonResponse({
      status: "error",
      message: "Aksi tidak dikenali"
    });
    
  } catch (err) {
    return createJsonResponse({
      status: "error",
      message: "Server Error: " + err.toString()
    });
  }
}
