package com.momx1.tastenotes;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.text.InputType;
import android.util.Base64;
import android.view.View;
import android.webkit.*;
import android.widget.EditText;
import androidx.webkit.JavaScriptReplyProxy;
import androidx.webkit.WebMessageCompat;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;
import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.util.Collections;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import org.json.JSONObject;

public class MainActivity extends Activity {
 private static final String ORIGIN="https://appassets.androidplatform.net";
 private static final String HOME=ORIGIN+"/assets/web/index.html";
 private static final int PICK_FILE=10, SAVE_BACKUP=11;
 private final ExecutorService executor=Executors.newSingleThreadExecutor();
 private WebView web;
 private ValueCallback<Uri[]> fileCallback;
 private String exportText,exportId;
 private JavaScriptReplyProxy exportReply;

 @Override public void onCreate(Bundle state){
  super.onCreate(state);
  web=new WebView(this);web.setBackgroundColor(Color.rgb(248,245,252));setContentView(web);
  getWindow().getDecorView().setOnApplyWindowInsetsListener((view,insets)->{
   view.setPadding(insets.getSystemWindowInsetLeft(),insets.getSystemWindowInsetTop(),insets.getSystemWindowInsetRight(),insets.getSystemWindowInsetBottom());return insets.consumeSystemWindowInsets();
  });
  WebSettings settings=web.getSettings();settings.setJavaScriptEnabled(true);settings.setDomStorageEnabled(true);
  settings.setAllowFileAccess(false);settings.setAllowContentAccess(true);settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
  settings.setSupportMultipleWindows(true);settings.setJavaScriptCanOpenWindowsAutomatically(false);
  settings.setSafeBrowsingEnabled(true);
  WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);
  WebViewAssetLoader loader=new WebViewAssetLoader.Builder().addPathHandler("/assets/",new WebViewAssetLoader.AssetsPathHandler(this)).build();
  web.setWebViewClient(new WebViewClient(){
   @Override public WebResourceResponse shouldInterceptRequest(WebView view,WebResourceRequest request){return loader.shouldInterceptRequest(request.getUrl());}
   @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){
    if(HOME.equals(request.getUrl().toString()))return false;
    if(request.isForMainFrame())openExternal(request.getUrl());return true;
   }
  });
  web.setWebChromeClient(new WebChromeClient(){
   @Override public boolean onShowFileChooser(WebView view,ValueCallback<Uri[]> callback,FileChooserParams params){
    if(fileCallback!=null)fileCallback.onReceiveValue(null);fileCallback=callback;
    try{startActivityForResult(params.createIntent(),PICK_FILE);return true;}catch(Exception e){fileCallback=null;callback.onReceiveValue(null);return false;}
   }
   @Override public boolean onCreateWindow(WebView view,boolean dialog,boolean userGesture,android.os.Message message){
    if(!userGesture)return false;
    WebView popup=new WebView(MainActivity.this);
    popup.setWebViewClient(new WebViewClient(){@Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest req){openExternal(req.getUrl());v.destroy();return true;}});
    ((WebView.WebViewTransport)message.obj).setWebView(popup);message.sendToTarget();return true;
   }
  });
  if(!WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)){
   new AlertDialog.Builder(this).setTitle("Android System WebView 업데이트").setMessage("Play 스토어에서 Android System WebView 또는 Chrome을 업데이트한 뒤 앱을 다시 열어 주세요.").setPositiveButton("확인",(d,w)->finish()).show();return;
  }
  WebViewCompat.addWebMessageListener(web,"TasteBridge",Collections.singleton(ORIGIN),(view,message,sourceOrigin,isMainFrame,reply)->{
   if(!isMainFrame||!ORIGIN.equals(sourceOrigin.toString()))return;
   try{
    JSONObject request=new JSONObject(message.getData());String id=request.getString("id"),action=request.getString("action");JSONObject payload=request.optJSONObject("payload");
    if("settings".equals(action))showKeyDialog(id,reply);
    else if("export".equals(action))exportBackup(id,payload,reply);
    else if("search".equals(action))executor.execute(()->search(id,payload,reply));
    else respond(id,error("지원하지 않는 요청입니다."),reply);
   }catch(Exception ignored){}
  });
  web.loadUrl(HOME);
 }
 private void openExternal(Uri uri){
  if(!"https".equals(uri.getScheme()))return;
  try{startActivity(new Intent(Intent.ACTION_VIEW,uri).addCategory(Intent.CATEGORY_BROWSABLE));}catch(Exception ignored){}
 }
 private void showKeyDialog(String id,JavaScriptReplyProxy reply){
  EditText input=new EditText(this);input.setSingleLine(true);input.setInputType(InputType.TYPE_CLASS_TEXT|InputType.TYPE_TEXT_VARIATION_PASSWORD);input.setHint("Serper API 키 붙여 넣기");input.setPadding(40,20,40,20);
  AlertDialog dialog=new AlertDialog.Builder(this).setTitle("Google 이미지 검색 설정").setMessage("Serper 키를 입력하세요. 키는 이 휴대폰에서 암호화해 보관하며 이미지 검색 요청에만 사용합니다. 빈 값으로 저장하면 기존 키를 제거합니다.").setView(input).setPositiveButton("저장",null).setNegativeButton("취소",(d,w)->respond(id,error("설정을 취소했습니다."),reply)).create();
  dialog.setOnCancelListener(d->respond(id,error("설정을 취소했습니다."),reply));dialog.setOnShowListener(d->dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(v->{
   String value=input.getText().toString().trim();if(!value.isEmpty()&&(value.length()<16||value.length()>512)){input.setError("키를 다시 확인해 주세요.");return;}
   try{saveKey(value);respond(id,new JSONObject().put("ok",true),reply);dialog.dismiss();}catch(Exception e){input.setError("키를 저장하지 못했습니다.");}
  }));dialog.show();
 }
 private SecretKey secretKey()throws Exception{
  KeyStore store=KeyStore.getInstance("AndroidKeyStore");store.load(null);
  if(store.containsAlias("taste-search-key"))return (SecretKey)store.getKey("taste-search-key",null);
  KeyGenerator generator=KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES,"AndroidKeyStore");generator.init(new KeyGenParameterSpec.Builder("taste-search-key",KeyProperties.PURPOSE_ENCRYPT|KeyProperties.PURPOSE_DECRYPT).setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE).build());return generator.generateKey();
 }
 private void saveKey(String value)throws Exception{
  if(value.isEmpty()){getPreferences(MODE_PRIVATE).edit().remove("key").apply();return;}
  Cipher cipher=Cipher.getInstance("AES/GCM/NoPadding");cipher.init(Cipher.ENCRYPT_MODE,secretKey());
  String packed=Base64.encodeToString(cipher.getIV(),Base64.NO_WRAP)+":"+Base64.encodeToString(cipher.doFinal(value.getBytes(StandardCharsets.UTF_8)),Base64.NO_WRAP);
  getPreferences(MODE_PRIVATE).edit().putString("key",packed).apply();
 }
 private String readKey()throws Exception{
  String stored=getPreferences(MODE_PRIVATE).getString("key","");if(stored.isEmpty())return "";
  String[] parts=stored.split(":");Cipher cipher=Cipher.getInstance("AES/GCM/NoPadding");cipher.init(Cipher.DECRYPT_MODE,secretKey(),new GCMParameterSpec(128,Base64.decode(parts[0],Base64.NO_WRAP)));return new String(cipher.doFinal(Base64.decode(parts[1],Base64.NO_WRAP)),StandardCharsets.UTF_8);
 }
 private void search(String id,JSONObject payload,JavaScriptReplyProxy reply){
  HttpURLConnection connection=null;
  try{
   String key=readKey(),q=payload==null?"":payload.optString("q").trim();
   if(key.isEmpty()){respond(id,new JSONObject().put("code","SETUP_REQUIRED").put("error","이미지 검색 키를 설정해 주세요."),reply);return;}
   if(q.isEmpty()||q.length()>250){respond(id,error("검색어를 250자 이내로 입력해 주세요."),reply);return;}
   connection=(HttpURLConnection)new URL("https://google.serper.dev/images").openConnection();connection.setInstanceFollowRedirects(false);connection.setConnectTimeout(12000);connection.setReadTimeout(15000);connection.setRequestMethod("POST");connection.setRequestProperty("X-API-KEY",key);connection.setRequestProperty("Content-Type","application/json");connection.setDoOutput(true);
   byte[] body=new JSONObject().put("q",q).put("gl","kr").put("hl","ko").put("num",24).toString().getBytes(StandardCharsets.UTF_8);
   try(OutputStream stream=connection.getOutputStream()){stream.write(body);}
   int status=connection.getResponseCode();if(status!=200){respond(id,error(status==401||status==403?"Serper 키를 확인해 주세요.":status==429?"검색 한도에 도달했습니다.":"이미지 검색에 실패했습니다."),reply);return;}
   try(InputStream stream=connection.getInputStream();ByteArrayOutputStream result=new ByteArrayOutputStream()){
    byte[] buffer=new byte[8192];int count;while((count=stream.read(buffer))!=-1){if(result.size()+count>2000000)throw new IOException();result.write(buffer,0,count);}respond(id,new JSONObject(result.toString("UTF-8")),reply);
   }
  }catch(Exception e){respond(id,error("검색에 연결하지 못했습니다. 인터넷 연결과 검색 키를 확인해 주세요."),reply);}finally{if(connection!=null)connection.disconnect();}
 }
 private void exportBackup(String id,JSONObject payload,JavaScriptReplyProxy reply){
  if(exportReply!=null){respond(id,error("진행 중인 파일 저장을 먼저 완료해 주세요."),reply);return;}
  exportText=payload.optString("text");if(exportText.length()>40000000){respond(id,error("백업 파일이 너무 큽니다."),reply);exportText=null;return;}
  exportId=id;exportReply=reply;
  Intent intent=new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("application/json").putExtra(Intent.EXTRA_TITLE,payload.optString("name","취향록-백업.json"));
  try{startActivityForResult(intent,SAVE_BACKUP);}catch(Exception e){respond(id,error("파일 저장 앱을 열지 못했습니다."),reply);clearExport();}
 }
 private void clearExport(){exportText=null;exportId=null;exportReply=null;}
 @Override protected void onActivityResult(int requestCode,int resultCode,Intent data){
  super.onActivityResult(requestCode,resultCode,data);
  if(requestCode==PICK_FILE&&fileCallback!=null){fileCallback.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(resultCode,data));fileCallback=null;}
  if(requestCode==SAVE_BACKUP&&exportReply!=null){
   if(resultCode!=RESULT_OK||data==null||data.getData()==null){respond(exportId,error("파일 저장을 취소했습니다."),exportReply);clearExport();return;}
   final String text=exportText,id=exportId;final JavaScriptReplyProxy reply=exportReply;final Uri uri=data.getData();clearExport();
   executor.execute(()->{try(OutputStream stream=getContentResolver().openOutputStream(uri)){stream.write(text.getBytes(StandardCharsets.UTF_8));respond(id,new JSONObject().put("ok",true),reply);}catch(Exception e){respond(id,error("백업 파일을 저장하지 못했습니다."),reply);}});
  }
 }
 private JSONObject error(String message){try{return new JSONObject().put("error",message);}catch(Exception e){throw new RuntimeException(e);}}
 private void respond(String id,JSONObject result,JavaScriptReplyProxy reply){runOnUiThread(()->{if(isFinishing()||isDestroyed())return;try{reply.postMessage(new JSONObject().put("id",id).put("result",result).toString());}catch(Exception ignored){}});}
 @Override public void onBackPressed(){web.evaluateJavascript("(function(){if(document.querySelector('[role=dialog]')){var dialogs=document.querySelectorAll('[role=dialog]');var el=dialogs[dialogs.length-1];var button=el.querySelector('[aria-label=\"이미지 검색 닫기\"], [aria-label=\"닫기\"]');if(button&&!button.disabled)button.click();return true}return false})()",value->{if(!"true".equals(value))moveTaskToBack(true);});}
 @Override protected void onDestroy(){if(fileCallback!=null)fileCallback.onReceiveValue(null);executor.shutdownNow();if(web!=null){WebViewCompat.removeWebMessageListener(web,"TasteBridge");web.destroy();}super.onDestroy();}
}
