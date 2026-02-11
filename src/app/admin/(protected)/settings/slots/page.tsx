"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type SlotRule = {
  id: string;
  weekday: number;
  startTime: string;
  endTime: string;
  intervalMinutes: number;
  capacity: number;
};

type SlotRuleTemplate = {
  id: string;
  name: string;
  rules: Omit<SlotRule, "id">[];
};

const weekdays = ["日", "月", "火", "水", "木", "金", "土"];

export default function SlotSettingsPage() {
  const [rules, setRules] = useState<SlotRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [bookingMode, setBookingMode] = useState<"time" | "session">("time");
  const [savingMode, setSavingMode] = useState(false);
  const [templates, setTemplates] = useState<SlotRuleTemplate[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    weekday: 1,
    startTime: "09:00",
    endTime: "12:00",
    intervalMinutes: 30,
    capacity: 1
  });

  const fetchRules = async () => {
    const response = await fetch("/api/admin/slot-rules");
    const data = await response.json();
    setRules(data.rules ?? []);
  };

  const fetchTemplates = async () => {
    const response = await fetch("/api/admin/slot-templates");
    const data = await response.json();
    setTemplates(data.templates ?? []);
  };

  const fetchClinic = async () => {
    const response = await fetch("/api/admin/clinic");
    if (!response.ok) {
      return;
    }
    const data = await response.json();
    setBookingMode(data.clinic?.bookingMode ?? "time");
  };

  useEffect(() => {
    fetchRules();
    fetchClinic();
    fetchTemplates();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `/api/admin/slot-rules/${editingId}` : "/api/admin/slot-rules";
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    if (!response.ok) {
      setError("枠ルールの保存に失敗しました。");
      setLoading(false);
      return;
    }
    setLoading(false);
    setEditingId(null);
    await fetchRules();
  };

  const handleEdit = (rule: SlotRule) => {
    setEditingId(rule.id);
    setForm({
      weekday: rule.weekday,
      startTime: rule.startTime,
      endTime: rule.endTime,
      intervalMinutes: rule.intervalMinutes,
      capacity: rule.capacity
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("この枠ルールを削除しますか？")) {
      return;
    }
    await fetch(`/api/admin/slot-rules/${id}`, { method: "DELETE" });
    await fetchRules();
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim() || rules.length === 0) {
      setError("テンプレート名と枠ルールを用意してください。");
      return;
    }
    setError(null);
    const response = await fetch("/api/admin/slot-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: templateName,
        rules: rules.map(({ weekday, startTime, endTime, intervalMinutes, capacity }) => ({
          weekday,
          startTime,
          endTime,
          intervalMinutes,
          capacity
        }))
      })
    });
    if (!response.ok) {
      setError("テンプレートの保存に失敗しました。");
      return;
    }
    setTemplateName("");
    await fetchTemplates();
  };

  const handleApplyTemplate = async () => {
    if (!selectedTemplateId) {
      setError("テンプレートを選択してください。");
      return;
    }
    setError(null);
    const response = await fetch(`/api/admin/slot-templates/${selectedTemplateId}/apply`, {
      method: "POST"
    });
    if (!response.ok) {
      setError("テンプレートの適用に失敗しました。");
      return;
    }
    await fetchRules();
  };

  const handleDeleteTemplate = async () => {
    if (!selectedTemplateId) return;
    if (!confirm("このテンプレートを削除しますか？")) return;
    await fetch(`/api/admin/slot-templates/${selectedTemplateId}`, { method: "DELETE" });
    setSelectedTemplateId("");
    await fetchTemplates();
  };

  const handleBookingModeChange = async (value: "time" | "session") => {
    setBookingMode(value);
    setSavingMode(true);
    await fetch("/api/admin/clinic", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingMode: value })
    });
    setSavingMode(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">枠設定</h1>
        <p className="text-sm text-muted-foreground">
          募集方式と曜日・時間帯・間隔・上限の設定を管理します。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>募集方式</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">方式</label>
            <Select
              value={bookingMode}
              onChange={(event) =>
                handleBookingModeChange(event.target.value as "time" | "session")
              }
              disabled={savingMode}
            >
              <option value="time">時間ごとに募集</option>
              <option value="session">午前/午後の部で募集</option>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            午前/午後の部は、設定された時間帯をもとに自動で分割されます。
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>テンプレート</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">テンプレート選択</label>
              <Select
                value={selectedTemplateId}
                onChange={(event) => setSelectedTemplateId(event.target.value)}
              >
                <option value="">選択してください</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </Select>
            </div>
            <Button type="button" variant="outline" onClick={handleApplyTemplate}>
              適用
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteTemplate}>
              削除
            </Button>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">新規テンプレート名</label>
              <Input
                value={templateName}
                onChange={(event) => setTemplateName(event.target.value)}
                placeholder="例) 今週テンプレート"
              />
            </div>
            <Button type="button" onClick={handleSaveTemplate}>
              現在の枠ルールで作成
            </Button>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "枠ルール編集" : "枠ルール追加"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-5" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label className="text-sm font-medium">曜日</label>
              <Select
                value={String(form.weekday)}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, weekday: Number(event.target.value) }))
                }
              >
                {weekdays.map((label, index) => (
                  <option key={label} value={index}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">開始</label>
              <Input
                value={form.startTime}
                onChange={(event) => setForm((prev) => ({ ...prev, startTime: event.target.value }))}
                placeholder="09:00"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">終了</label>
              <Input
                value={form.endTime}
                onChange={(event) => setForm((prev) => ({ ...prev, endTime: event.target.value }))}
                placeholder="12:00"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">間隔(分)</label>
              <Input
                type="number"
                value={form.intervalMinutes}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    intervalMinutes: Number(event.target.value)
                  }))
                }
                min={5}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">上限</label>
              <Input
                type="number"
                value={form.capacity}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    capacity: Number(event.target.value)
                  }))
                }
                min={1}
                required
              />
            </div>
            <div className="md:col-span-5 flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? "保存中..." : editingId ? "更新" : "追加"}
              </Button>
              {editingId ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setEditingId(null);
                    setForm({
                      weekday: 1,
                      startTime: "09:00",
                      endTime: "12:00",
                      intervalMinutes: 30,
                      capacity: 1
                    });
                  }}
                >
                  キャンセル
                </Button>
              ) : null}
            </div>
            {error ? <p className="text-sm text-destructive md:col-span-5">{error}</p> : null}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>枠ルール一覧</CardTitle>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <p className="text-sm text-muted-foreground">枠ルールがありません。</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>曜日</TableHead>
                  <TableHead>時間</TableHead>
                  <TableHead>間隔</TableHead>
                  <TableHead>上限</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell>{weekdays[rule.weekday]}</TableCell>
                    <TableCell>
                      {rule.startTime} - {rule.endTime}
                    </TableCell>
                    <TableCell>{rule.intervalMinutes}分</TableCell>
                    <TableCell>{rule.capacity}人</TableCell>
                    <TableCell className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(rule)}>
                        編集
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(rule.id)}>
                        削除
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
