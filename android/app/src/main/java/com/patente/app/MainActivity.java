package com.patente.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import androidx.core.view.WindowCompat;

public class MainActivity extends BridgeActivity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    // جلوگیری از افتادن UI زیر status/navigation bar
    WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
  }
}