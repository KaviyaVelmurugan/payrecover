'use client';

import { ArrowDownRight, ArrowUpRight, Check, ChevronRight, CircleAlert, CreditCard, IndianRupee, LayoutDashboard, RefreshCcw, Search, ShoppingBag, Sparkles, WalletCards } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const attempts = [
  { order: '#PR-1048', customer: 'Aarav Shah', method: 'UPI', amount: '₹2,499', status: 'Recovered', time: '2 min ago' },
  { order: '#PR-1047', customer: 'Mira Nair', method: 'Visa •••• 4242', amount: '₹1,899', status: 'Failed', time: '8 min ago' },
  { order: '#PR-1046', customer: 'Rohan Das', method: 'Wallet', amount: '₹3,299', status: 'Paid', time: '14 min ago' },
  { order: '#PR-1045', customer: 'Diya Patel', method: 'UPI', amount: '₹799', status: 'Paid', time: '21 min ago' },
];

export default function Home() {
  const [section, setSection] = useState<'overview' | 'store'>('overview');
  useEffect(() => {
    const context = (document as Document & { modelContext?: { registerTool?: (tool: unknown, options?: { signal?: AbortSignal }) => void | Promise<void> } }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(context.registerTool({
      name: 'open_demo_checkout', title: 'Open demo checkout',
      description: 'Open the customer demo store and prepare the safe test checkout.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: () => { setSection('store'); return { view: 'demo_store', testMode: true }; },
    }, { signal: lifecycle.signal })).catch(() => undefined);
    return () => lifecycle.abort();
  }, []);
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b bg-background/92 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-7">
          <button className="flex items-center gap-2.5" onClick={() => setSection('overview')} aria-label="PayRecover home">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-blue-900/15"><RefreshCcw className="size-4.5" strokeWidth={2.5} /></span>
            <span className="text-lg font-bold tracking-[-0.04em]">PayRecover</span>
          </button>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="hidden rounded-full border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700 sm:inline-flex"><span className="mr-2 size-1.5 rounded-full bg-emerald-500" /> Test environment</Badge>
            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setSection(section === 'overview' ? 'store' : 'overview')}>
              {section === 'overview' ? <ShoppingBag /> : <LayoutDashboard />}{section === 'overview' ? 'Open demo store' : 'Merchant dashboard'}
            </Button>
          </div>
        </div>
      </header>
      {section === 'overview' ? <Dashboard /> : <DemoStore onBack={() => setSection('overview')} />}
    </main>
  );
}

function Dashboard() {
  return (
    <div className="mx-auto grid max-w-[1440px] gap-6 px-4 py-6 sm:px-7 lg:grid-cols-[220px_1fr]">
      <aside className="hidden lg:block"><nav className="sticky top-24 space-y-1" aria-label="Merchant navigation"><p className="mb-3 px-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Workspace</p><NavItem icon={<LayoutDashboard />} label="Overview" active /><NavItem icon={<WalletCards />} label="Payment attempts" /><NavItem icon={<CircleAlert />} label="Recovery rules" count="3" /><NavItem icon={<Sparkles />} label="Experiments" /></nav></aside>
      <section className="min-w-0 space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-medium text-primary">Sunday, 7 September</p><h1 className="mt-1 text-3xl font-bold tracking-[-0.04em] sm:text-4xl">Payment health</h1><p className="mt-2 text-muted-foreground">See what converted, what failed, and what your recovery flow saved.</p></div><Button variant="outline" className="w-fit rounded-xl"><Search /> Find an order</Button></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Gross revenue" value="₹1,84,620" change="+12.4%" icon={<IndianRupee />} /><Metric label="Authorization rate" value="87.6%" change="+2.1%" icon={<Check />} /><Metric label="Failed attempts" value="46" change="-8.0%" icon={<CircleAlert />} /><Metric label="Recovered revenue" value="₹18,740" change="+16.8%" icon={<RefreshCcw />} accent /></div>
        <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
          <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6"><div className="flex items-start justify-between"><div><h2 className="text-lg font-semibold tracking-tight">Checkout funnel</h2><p className="mt-1 text-sm text-muted-foreground">Last 7 days · 2,416 sessions</p></div><Badge variant="secondary" className="rounded-lg">Live demo data</Badge></div><div className="mt-8 space-y-5"><Funnel label="Checkout started" value="2,416" percent={100} /><Funnel label="Payment submitted" value="1,932" percent={80} /><Funnel label="Authorized" value="1,692" percent={70} /><Funnel label="Recovered after failure" value="164" percent={7} highlight /></div></section>
          <section className="overflow-hidden rounded-2xl bg-[#111c2d] p-6 text-white shadow-2xl shadow-slate-900/20"><div className="flex items-center justify-between"><span className="grid size-10 place-items-center rounded-xl bg-white/10"><Sparkles className="size-5 text-cyan-300" /></span><Badge className="bg-cyan-300 text-slate-950 hover:bg-cyan-300">Opportunity</Badge></div><h2 className="mt-8 text-2xl font-semibold tracking-[-0.03em]">UPI recovers 3× more failed card checkouts.</h2><p className="mt-3 text-sm leading-6 text-slate-300">Your recovery rule rescued 31 orders this week. Keep UPI as the first suggested alternative.</p><Button className="mt-7 rounded-xl bg-white text-slate-950 hover:bg-slate-100">Review recovery rule <ChevronRight /></Button></section>
        </div>
        <section className="overflow-hidden rounded-2xl border bg-card shadow-sm"><div className="flex items-center justify-between border-b px-5 py-4 sm:px-6"><div><h2 className="font-semibold">Recent payment attempts</h2><p className="text-sm text-muted-foreground">Every retry stays connected to its original order.</p></div><Button variant="ghost" size="sm">View all <ChevronRight /></Button></div><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-muted/55 text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-6 py-3 font-medium">Order</th><th className="px-4 py-3 font-medium">Customer</th><th className="px-4 py-3 font-medium">Method</th><th className="px-4 py-3 font-medium">Amount</th><th className="px-4 py-3 font-medium">Status</th><th className="px-6 py-3 text-right font-medium">When</th></tr></thead><tbody className="divide-y">{attempts.map((item) => <tr key={item.order} className="transition-colors hover:bg-muted/35"><td className="px-6 py-4 font-semibold">{item.order}</td><td className="px-4 py-4">{item.customer}</td><td className="px-4 py-4 text-muted-foreground">{item.method}</td><td className="px-4 py-4 font-medium">{item.amount}</td><td className="px-4 py-4"><StatusBadge status={item.status} /></td><td className="px-6 py-4 text-right text-muted-foreground">{item.time}</td></tr>)}</tbody></table></div></section>
      </section>
    </div>
  );
}

function DemoStore({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<'choose' | 'failed' | 'recovered'>('choose');
  return <section className="mx-auto max-w-6xl px-4 py-10 sm:px-7"><Button variant="ghost" className="mb-5 -ml-3" onClick={onBack}>← Back to dashboard</Button><div className="grid gap-8 lg:grid-cols-[1fr_420px]"><div><Badge className="rounded-full bg-cyan-100 text-cyan-800 hover:bg-cyan-100">Customer demo</Badge><h1 className="mt-5 max-w-2xl text-4xl font-bold tracking-[-0.05em] sm:text-6xl">A checkout built to recover, not just decline.</h1><p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">This storefront lets us test successful payments, failures, retries, and alternative payment suggestions safely.</p></div><div className="rounded-3xl border bg-card p-6 shadow-xl shadow-slate-200/60"><div className="flex gap-4"><div className="grid size-20 place-items-center rounded-2xl bg-cyan-50 text-3xl">🎧</div><div><p className="font-semibold">Orbit Wireless Headphones</p><p className="mt-1 text-sm text-muted-foreground">Midnight · 1 item</p><p className="mt-3 text-lg font-bold">₹2,499</p></div></div><div className="my-6 border-t"/><div className="flex justify-between text-sm"><span className="text-muted-foreground">Total</span><strong className="text-xl">₹2,499</strong></div><Dialog onOpenChange={(open) => !open && setStep('choose')}><DialogTrigger render={<Button className="mt-6 h-12 w-full rounded-xl text-base"><CreditCard /> Continue to test checkout</Button>} /><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>{step === 'choose' ? 'Choose a test outcome' : step === 'failed' ? 'Card payment was not completed' : 'Payment recovered'}</DialogTitle><DialogDescription>{step === 'choose' ? 'Explore the recovery journey without charging real money.' : step === 'failed' ? 'The order is still active. Try the recommended alternative below.' : 'The same order was successfully paid using UPI.'}</DialogDescription></DialogHeader>{step === 'choose' && <div className="grid gap-3 pt-2"><Button variant="outline" className="h-auto justify-start rounded-xl p-4" onClick={() => setStep('failed')}><CreditCard className="mr-2" /><span className="text-left"><strong className="block">Simulate failed card</strong><span className="text-xs text-muted-foreground">Shows the recovery recommendation</span></span></Button><Button className="h-auto justify-start rounded-xl p-4" onClick={() => setStep('recovered')}><WalletCards className="mr-2" /><span className="text-left"><strong className="block">Simulate successful UPI</strong><span className="text-xs text-primary-foreground/75">Confirms the test order immediately</span></span></Button></div>}{step === 'failed' && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="text-sm font-semibold text-amber-950">Recommended: retry with UPI</p><p className="mt-1 text-sm leading-6 text-amber-800">It has the highest recovery rate for similar failed card attempts.</p><Button className="mt-4 w-full rounded-xl" onClick={() => setStep('recovered')}><RefreshCcw /> Retry ₹2,499 with UPI</Button></div>}{step === 'recovered' && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center"><span className="mx-auto grid size-12 place-items-center rounded-full bg-emerald-600 text-white"><Check /></span><p className="mt-3 font-semibold text-emerald-950">Order #PR-1049 is paid</p><p className="mt-1 text-sm text-emerald-700">₹2,499 is now counted as recovered revenue.</p></div>}</DialogContent></Dialog><p className="mt-3 text-center text-xs text-muted-foreground">No real money will be charged.</p></div></div></section>;
}
function NavItem({ icon, label, active, count }: { icon: React.ReactNode; label: string; active?: boolean; count?: string }) { return <button className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}><span className="[&>svg]:size-4">{icon}</span><span>{label}</span>{count && <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">{count}</span>}</button>; }
function Metric({ label, value, change, icon, accent }: { label: string; value: string; change: string; icon: React.ReactNode; accent?: boolean }) { const up = change.startsWith('+'); return <article className={`rounded-2xl border p-5 shadow-sm ${accent ? 'border-cyan-200 bg-cyan-50/70' : 'bg-card'}`}><div className="flex items-center justify-between text-muted-foreground"><span className="text-sm font-medium">{label}</span><span className="[&>svg]:size-4">{icon}</span></div><p className="mt-4 text-2xl font-bold tracking-tight">{value}</p><p className="mt-2 flex items-center text-xs font-semibold text-emerald-600">{up ? <ArrowUpRight className="mr-1 size-3.5" /> : <ArrowDownRight className="mr-1 size-3.5" />}{change} <span className="ml-1 font-normal text-muted-foreground">vs last week</span></p></article>; }
function Funnel({ label, value, percent, highlight }: { label: string; value: string; percent: number; highlight?: boolean }) { return <div><div className="mb-2 flex justify-between text-sm"><span className={highlight ? 'font-semibold text-cyan-700' : 'font-medium'}>{label}</span><span className="font-semibold">{value}</span></div><Progress value={percent} className={`h-2.5 ${highlight ? '[&>div]:bg-cyan-500' : ''}`} /></div>; }
function StatusBadge({ status }: { status: string }) { const style = status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : status === 'Recovered' ? 'bg-cyan-50 text-cyan-700 border-cyan-200' : 'bg-rose-50 text-rose-700 border-rose-200'; return <Badge variant="outline" className={`rounded-full ${style}`}>{status}</Badge>; }
