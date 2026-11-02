"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { CollapsibleSection } from "@/components/admin/CEO/CollapsibleSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SystemLog = Record<string, unknown> & {
  id: string | number;
  event_type: string;
  domain: string;
  message?: string | null;
  created_at: string;
};

type LogsResult = {
  logs: SystemLog[];
  total: number;
};

const PAGE_SIZE = 25;

function displayDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? value : date.toLocaleString();
}

export function SystemLogsClient() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [domain, setDomain] = useState("");
  const [eventType, setEventType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [filters, setFilters] = useState({
    domain: "",
    eventType: "",
    from: "",
    to: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(PAGE_SIZE),
    });
    if (filters.domain) params.set("domain", filters.domain);
    if (filters.eventType) params.set("eventType", filters.eventType);
    if (filters.from) params.set("from", `${filters.from}T00:00:00.000Z`);
    if (filters.to) params.set("to", `${filters.to}T23:59:59.999Z`);

    try {
      const response = await fetch(`/api/system-logs?${params}`, {
        cache: "no-store",
        credentials: "include",
      });
      const result = (await response.json()) as Partial<LogsResult> & {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(result.error ?? "Failed to load system logs");
      }
      if (!Array.isArray(result.logs) || typeof result.total !== "number") {
        throw new Error("The system logs response was invalid");
      }
      setLogs(result.logs);
      setTotal(result.total);
    } catch (loadError) {
      console.error("Failed to load system logs:", loadError);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load system logs"
      );
      setLogs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setFilters({
      domain,
      eventType: eventType.trim(),
      from,
      to,
    });
  }

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <CollapsibleSection
        title="Filters"
        description="Filter admin action logs by action, domain, or date."
        defaultOpen
      >
        <form onSubmit={applyFilters} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="logs-event-type">Action</Label>
            <Input
              id="logs-event-type"
              value={eventType}
              onChange={(event) => setEventType(event.target.value)}
              placeholder="All actions"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="logs-domain">Domain</Label>
            <select
              id="logs-domain"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={domain}
              onChange={(event) => setDomain(event.target.value)}
            >
              <option value="">All domains</option>
              {["editorial", "brand", "safety", "civic", "contributors", "budget", "navigation", "sponsorship", "search", "games"].map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="logs-from">From</Label>
            <Input
              id="logs-from"
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="logs-to">To</Label>
            <Input
              id="logs-to"
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 md:col-span-2 xl:col-span-4">
            <Button type="submit" disabled={loading}>Apply filters</Button>
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => {
                setDomain("");
                setEventType("");
                setFrom("");
                setTo("");
                setFilters({ domain: "", eventType: "", from: "", to: "" });
                setPage(1);
              }}
            >
              Clear
            </Button>
          </div>
        </form>
      </CollapsibleSection>

      {error ? (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="ml-3"
            onClick={() => void loadLogs()}
            disabled={loading}
          >
            Retry
          </Button>
        </div>
      ) : null}

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">Events</h2>
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading…" : `${total.toLocaleString()} total`}
          </p>
        </div>
        {logs.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[48rem] text-left text-sm">
              <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Domain</th>
                  <th scope="col" className="px-4 py-3 font-medium">Action</th>
                  <th scope="col" className="px-4 py-3 font-medium">Actor / Entity</th>
                  <th scope="col" className="px-4 py-3 font-medium">Created</th>
                  <th scope="col" className="px-4 py-3 font-medium">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log) => (
                  <tr key={String(log.id)} className="align-top transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <span className="rounded-full border border-border bg-muted px-2 py-1 text-xs font-medium capitalize">
                        {log.domain}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{log.event_type}</td>
                    <td className="max-w-md px-4 py-3 text-muted-foreground">
                      {typeof log.message === "string" && log.message
                        ? log.message
                        : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {displayDate(log.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <details className="max-w-xs">
                        <summary className="cursor-pointer text-primary underline-offset-4 hover:underline">
                          View
                        </summary>
                        <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-md bg-muted p-3 text-xs">
                          {JSON.stringify(log, null, 2)}
                        </pre>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            {loading ? "Loading system logs…" : error ? "Logs are unavailable." : "No logs match these filters."}
          </p>
        )}
        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Page {page} of {pageCount}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={loading || page <= 1}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
              disabled={loading || page >= pageCount}
            >
              Next
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
