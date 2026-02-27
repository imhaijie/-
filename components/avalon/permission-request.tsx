"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, Bell, CheckCircle2, XCircle, Shield } from "lucide-react";
import {
  requestAllPermissions,
  isAudioUnlocked,
  isNotificationGranted,
  playSuccess,
} from "@/lib/avalon/audio";

interface PermissionRequestProps {
  onComplete: () => void;
}

export function PermissionRequest({ onComplete }: PermissionRequestProps) {
  const [audioGranted, setAudioGranted] = useState(false);
  const [notificationGranted, setNotificationGranted] = useState(false);
  const [requesting, setRequesting] = useState(false);

  // Check initial permission state on mount (client-side only)
  useEffect(() => {
    setAudioGranted(isAudioUnlocked());
    setNotificationGranted(isNotificationGranted());
  }, []);

  const handleRequestPermissions = async () => {
    setRequesting(true);
    const result = await requestAllPermissions();
    setAudioGranted(result.audio);
    setNotificationGranted(result.notification);
    
    if (result.audio) {
      playSuccess();
    }
    
    setRequesting(false);
  };

  const handleContinue = () => {
    // Always allow continuing, even without permissions
    onComplete();
  };

  const allGranted = audioGranted && notificationGranted;

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-4 py-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Shield className="mx-auto mb-4 h-16 w-16 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">权限设置</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            为了获得最佳游戏体验，请授予以下权限
          </p>
        </div>

        <div className="space-y-3">
          {/* Audio Permission */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className={`rounded-full p-2 ${audioGranted ? "bg-good/10" : "bg-secondary"}`}>
                <Volume2 className={`h-5 w-5 ${audioGranted ? "text-good" : "text-muted-foreground"}`} />
              </div>
              <div>
                <p className="font-medium text-foreground">音频播放</p>
                <p className="text-xs text-muted-foreground">倒计时提示音和结束警报</p>
              </div>
            </div>
            {audioGranted ? (
              <CheckCircle2 className="h-5 w-5 text-good" />
            ) : (
              <XCircle className="h-5 w-5 text-muted-foreground" />
            )}
          </div>

          {/* Notification Permission */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className={`rounded-full p-2 ${notificationGranted ? "bg-good/10" : "bg-secondary"}`}>
                <Bell className={`h-5 w-5 ${notificationGranted ? "text-good" : "text-muted-foreground"}`} />
              </div>
              <div>
                <p className="font-medium text-foreground">系统通知</p>
                <p className="text-xs text-muted-foreground">发言时间结束时弹窗提醒</p>
              </div>
            </div>
            {notificationGranted ? (
              <CheckCircle2 className="h-5 w-5 text-good" />
            ) : (
              <XCircle className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Info box */}
        <div className="mt-4 rounded-md bg-primary/5 px-4 py-3">
          <p className="text-xs text-primary">
            {allGranted
              ? "已获得所有权限，游戏体验将更加完整"
              : "点击下方按钮请求权限，或直接跳过进入游戏"}
          </p>
        </div>

        {/* Action buttons */}
        <div className="mt-6 space-y-3">
          {!allGranted && (
            <Button
              className="w-full"
              size="lg"
              onClick={handleRequestPermissions}
              disabled={requesting}
            >
              {requesting ? "请求中..." : "授予权限"}
            </Button>
          )}
          <Button
            variant={allGranted ? "default" : "outline"}
            className="w-full"
            size="lg"
            onClick={handleContinue}
          >
            {allGranted ? "开始配置游戏" : "跳过，直接进入"}
          </Button>
        </div>
      </div>
    </div>
  );
}
