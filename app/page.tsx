'use client';

import {
  Check,
  ChevronRight,
  CircleAlert,
  CreditCard,
  IndianRupee,
  LayoutDashboard,
  LoaderCircle,
  Minus,
  Plus,
  RefreshCcw,
  ShoppingBag,
  Sparkles,
  Trash2,
  WalletCards,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { AdyenCheckoutPanel } from '@/components/adyen-checkout';

type View = 'overview' | 'store';
type Product = {
  id: string;
  name: string;
  description: string;
  category: string;
  priceMinor: number;
};
type Cart = Record<string, number>;
type Attempt = {
  id: string;
  orderId: string;
  customer: string;
  method: string;
  amountMinor: number;
  status: string;
  failureCategory?: string | null;
  recoveredFromAttemptId?: string | null;
};
type RecoveryDecision = {
  eligible: boolean;
  category?: string;
  recommendedMethod?: string | null;
  timing?: string;
  label: string;
  reason: string;
};
type DashboardData = {
  summary: {
    orders: number;
    revenueMinor: number;
    failedOrders: number;
    recoveredOrders: number;
    recoveredMinor: number;
    retryAttempts: number;
    successfulRetries: number;
    failedAttempts: number;
  };
  attempts: Attempt[];
  failures: { category: string; count: number }[];
  funnel: { eventName: string; sessions: number }[];
  campaigns: {
    campaign: string;
    orders: number;
    paidOrders: number;
    revenueMinor: number;
  }[];
  methods: { method: string; attempts: number; authorised: number }[];
  experiments: { variant: string; offered: number; started: number }[];
};

const productIcons: Record<string, string> = {
  prod_headphones: '🎧',
  prod_watch: '⌚',
  prod_speaker: '🔊',
  prod_charger: '⚡',
  prod_earbuds: '🎵',
  prod_stand: '💻',
};
const formatMoney = (minor: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(minor / 100);
const trackEvent = (event: {
  eventName: string;
  sessionId: string;
  orderId?: string;
  paymentMethod?: string;
  campaign: string;
  experimentVariant?: string;
}) => {
  void fetch('/api/analytics/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  }).catch(() => undefined);
};

export default function Home() {
  const [view, setView] = useState<View>('overview');
  useEffect(() => {
    const context = (
      document as Document & {
        modelContext?: {
          registerTool?: (
            tool: unknown,
            options?: { signal?: AbortSignal },
          ) => void | Promise<void>;
        };
      }
    ).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(
      context.registerTool(
        {
          name: 'open_demo_checkout',
          title: 'Open demo checkout',
          description:
            'Open the customer store and start a persistent test order.',
          inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute: () => {
            setView('store');
            return { view: 'store', persistence: 'D1', testMode: true };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => undefined);
    return () => lifecycle.abort();
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Header view={view} onChange={setView} />
      {view === 'overview' ? (
        <Dashboard />
      ) : (
        <Store onBack={() => setView('overview')} />
      )}
    </main>
  );
}

function Header({
  view,
  onChange,
}: {
  view: View;
  onChange: (view: View) => void;
}) {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/92 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-7">
        <button
          className="flex items-center gap-2.5"
          onClick={() => onChange('overview')}
          aria-label="PayRecover home"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-blue-900/15">
            <RefreshCcw className="size-4.5" strokeWidth={2.5} />
          </span>
          <span className="text-lg font-bold tracking-[-0.04em]">
            PayRecover
          </span>
        </button>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="hidden rounded-full border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700 sm:inline-flex"
          >
            <span className="mr-2 size-1.5 rounded-full bg-emerald-500" /> Adyen
            test-ready
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => onChange(view === 'overview' ? 'store' : 'overview')}
          >
            {view === 'overview' ? <ShoppingBag /> : <LayoutDashboard />}
            {view === 'overview' ? 'Open demo store' : 'Merchant dashboard'}
          </Button>
        </div>
      </div>
    </header>
  );
}

function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    void fetch('/api/dashboard')
      .then(async (response) => {
        if (!response.ok) throw new Error();
        return response.json() as Promise<DashboardData>;
      })
      .then(setData)
      .catch(() => setError('Dashboard data could not be loaded.'));
  }, []);
  const summary = data?.summary;
  const authorised =
    data?.attempts.filter((attempt) => attempt.status === 'authorised')
      .length ?? 0;
  const totalAttempts = data?.attempts.length ?? 0;
  const authRate = totalAttempts
    ? Math.round((authorised / totalAttempts) * 100)
    : 0;
  const retryRate = Number(summary?.retryAttempts)
    ? Math.round(
        (Number(summary?.successfulRetries) / Number(summary?.retryAttempts)) *
          100,
      )
    : 0;

  return (
    <div className="mx-auto grid max-w-[1440px] gap-6 px-4 py-6 sm:px-7 lg:grid-cols-[220px_1fr]">
      <aside className="hidden lg:block">
        <nav
          className="sticky top-24 space-y-1"
          aria-label="Merchant navigation"
        >
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Workspace
          </p>
          <NavItem icon={<LayoutDashboard />} label="Overview" active />
          <NavItem icon={<WalletCards />} label="Payment attempts" />
          <NavItem icon={<CircleAlert />} label="Recovery rules" />
          <NavItem icon={<Sparkles />} label="Experiments" />
        </nav>
      </aside>
      <section className="min-w-0 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary">
              Merchant workspace
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
              Payment health
            </h1>
            <p className="mt-2 text-muted-foreground">
              Transparent recovery rules turn payment failures into safe next
              actions.
            </p>
          </div>
          <DemoReset />
        </div>
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric
            label="Paid revenue"
            value={summary ? formatMoney(Number(summary.revenueMinor)) : '—'}
            icon={<IndianRupee />}
          />
          <Metric
            label="Authorization rate"
            value={data ? `${authRate}%` : '—'}
            icon={<Check />}
          />
          <Metric
            label="Retry success"
            value={data ? `${retryRate}%` : '—'}
            icon={<CircleAlert />}
          />
          <Metric
            label="Recovered revenue"
            value={summary ? formatMoney(Number(summary.recoveredMinor)) : '—'}
            icon={<RefreshCcw />}
            accent
          />
        </div>
        <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
          <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">Lifecycle snapshot</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Built from persisted test orders
                </p>
              </div>
              <Badge variant="secondary">D1 data</Badge>
            </div>
            <div className="mt-8 space-y-5">
              <Funnel
                label="Orders created"
                value={String(summary?.orders ?? 0)}
                percent={summary?.orders ? 100 : 0}
              />
              <Funnel
                label="Payment attempts"
                value={String(totalAttempts)}
                percent={
                  summary?.orders
                    ? Math.min(
                        100,
                        (totalAttempts / Number(summary.orders)) * 100,
                      )
                    : 0
                }
              />
              <Funnel
                label="Authorized attempts"
                value={String(authorised)}
                percent={authRate}
              />
              <Funnel
                label="Recovered orders"
                value={String(summary?.recoveredOrders ?? 0)}
                percent={
                  summary?.orders
                    ? (Number(summary.recoveredOrders) /
                        Number(summary.orders)) *
                      100
                    : 0
                }
                highlight
              />
            </div>
          </section>
          <RecoveryRules failures={data?.failures ?? []} />
        </div>
        <MarketingAnalytics data={data} />
        <AttemptTable
          attempts={data?.attempts ?? []}
          loading={!data && !error}
        />
      </section>
    </div>
  );
}

function Store({ onBack }: { onBack: () => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Cart>({});
  const [loading, setLoading] = useState(true);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [campaign, setCampaign] = useState('direct');
  useEffect(() => {
    void fetch('/api/catalog')
      .then((response) => response.json() as Promise<{ products?: Product[] }>)
      .then((result) => setProducts(result.products ?? []))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    const value =
      new URLSearchParams(window.location.search)
        .get('utm_campaign')
        ?.slice(0, 100) || 'direct';
    void Promise.resolve(value).then(setCampaign);
    trackEvent({ eventName: 'store_viewed', sessionId, campaign: value });
  }, [sessionId]);
  const cartItems = useMemo(
    () =>
      products
        .filter((product) => cart[product.id])
        .map((product) => ({ ...product, quantity: cart[product.id] })),
    [cart, products],
  );
  const displayTotal = cartItems.reduce(
    (sum, item) => sum + item.priceMinor * item.quantity,
    0,
  );
  const update = (id: string, delta: number) => {
    if (delta > 0)
      trackEvent({ eventName: 'product_added', sessionId, campaign });
    setCart((current) => {
      const quantity = Math.max(0, Math.min(10, (current[id] ?? 0) + delta));
      const next = { ...current };
      if (quantity) next[id] = quantity;
      else delete next[id];
      return next;
    });
  };

  return (
    <section className="mx-auto max-w-[1320px] px-4 py-8 sm:px-7">
      <Button variant="ghost" className="mb-4 -ml-3" onClick={onBack}>
        ← Back to dashboard
      </Button>
      <div className="mb-8">
        <div className="flex flex-wrap gap-2">
          <Badge className="rounded-full bg-cyan-100 text-cyan-800 hover:bg-cyan-100">
            Customer demo
          </Badge>
          <Badge variant="outline" className="rounded-full">
            Campaign: {campaign}
          </Badge>
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-[-0.04em] sm:text-5xl">
          Build a test cart
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Choose products below. The server will re-price them before creating
          the order.
        </p>
      </div>
      <div className="grid gap-7 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            <div className="col-span-full flex items-center gap-2 rounded-2xl border p-8 text-muted-foreground">
              <LoaderCircle className="animate-spin" /> Loading products…
            </div>
          ) : (
            products.map((product) => (
              <article
                key={product.id}
                className="flex flex-col rounded-2xl border bg-card p-5 shadow-sm"
              >
                <div
                  className="grid size-14 place-items-center rounded-2xl bg-cyan-50 text-2xl"
                  aria-hidden="true"
                >
                  {productIcons[product.id] ?? '📦'}
                </div>
                <Badge variant="secondary" className="mt-5 w-fit">
                  {product.category}
                </Badge>
                <h2 className="mt-3 text-lg font-semibold">{product.name}</h2>
                <p className="mt-1 flex-1 text-sm leading-6 text-muted-foreground">
                  {product.description}
                </p>
                <div className="mt-5 flex items-center justify-between">
                  <strong>{formatMoney(product.priceMinor)}</strong>
                  {cart[product.id] ? (
                    <Quantity
                      value={cart[product.id]}
                      onMinus={() => update(product.id, -1)}
                      onPlus={() => update(product.id, 1)}
                    />
                  ) : (
                    <Button
                      size="sm"
                      className="rounded-xl"
                      onClick={() => update(product.id, 1)}
                    >
                      <Plus /> Add
                    </Button>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
        <aside className="h-fit rounded-3xl border bg-card p-5 shadow-xl shadow-slate-200/50 lg:sticky lg:top-24">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Your cart</h2>
            <Badge variant="secondary">
              {cartItems.reduce((sum, item) => sum + item.quantity, 0)} items
            </Badge>
          </div>
          {cartItems.length === 0 ? (
            <div className="py-12 text-center">
              <ShoppingBag className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">
                Add a product to begin.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted">
                    {productIcons[item.id]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} × {formatMoney(item.priceMinor)}
                    </p>
                  </div>
                  <button
                    aria-label={`Remove ${item.name}`}
                    onClick={() =>
                      setCart((current) => {
                        const next = { ...current };
                        delete next[item.id];
                        return next;
                      })
                    }
                  >
                    <Trash2 className="size-4 text-muted-foreground hover:text-rose-600" />
                  </button>
                </div>
              ))}
              <div className="border-t pt-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Estimated total
                  </span>
                  <strong className="text-xl">
                    {formatMoney(displayTotal)}
                  </strong>
                </div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  Final total is calculated securely by the server.
                </p>
                <Button
                  className="mt-5 h-11 w-full rounded-xl"
                  onClick={() => {
                    trackEvent({
                      eventName: 'checkout_started',
                      sessionId,
                      campaign,
                    });
                    setCheckoutOpen(true);
                  }}
                >
                  Create test order <ChevronRight />
                </Button>
              </div>
            </div>
          )}
        </aside>
      </div>
      <CheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        items={cartItems.map(({ id, quantity }) => ({
          productId: id,
          quantity,
        }))}
        sessionId={sessionId}
        campaign={campaign}
      />
    </section>
  );
}

function CheckoutDialog({
  open,
  onOpenChange,
  items,
  sessionId,
  campaign,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: { productId: string; quantity: number }[];
  sessionId: string;
  campaign: string;
}) {
  const [name, setName] = useState('Kaviya Velmurugan');
  const [email, setEmail] = useState('shopper@example.com');
  const [stage, setStage] = useState<
    'details' | 'choose' | 'adyen' | 'processing' | 'failed' | 'paid'
  >('details');
  const [order, setOrder] = useState<{ id: string; totalMinor: number } | null>(
    null,
  );
  const [failedAttemptId, setFailedAttemptId] = useState('');
  const [adyenConfigured, setAdyenConfigured] = useState(false);
  const [adyenSession, setAdyenSession] = useState<{
    session: { id: string; sessionData: string };
    clientKey: string;
  } | null>(null);
  const [recommendation, setRecommendation] = useState<RecoveryDecision>({
    eligible: true,
    recommendedMethod: 'upi',
    timing: 'now',
    label: 'Offer UPI now',
    reason:
      'Offer a different payment method instead of repeating the declined attempt.',
  });
  const [experiment, setExperiment] = useState({
    variant: 'control',
    message: 'Retry with UPI',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const createOrder = async () => {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: name,
          customerEmail: email,
          campaign,
          items,
        }),
      });
      const result = (await response.json()) as {
        error?: string;
        order?: { id: string; totalMinor: number };
      };
      if (!response.ok || !result.order) throw new Error(result.error);
      setOrder(result.order);
      trackEvent({
        eventName: 'order_created',
        sessionId,
        orderId: result.order.id,
        campaign,
      });
      setStage('choose');
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'Could not create order.',
      );
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    if (open)
      void fetch('/api/adyen/config')
        .then(
          (response) => response.json() as Promise<{ configured?: boolean }>,
        )
        .then((result) => setAdyenConfigured(Boolean(result.configured)))
        .catch(() => setAdyenConfigured(false));
  }, [open]);
  const simulate = async (
    method: 'card' | 'upi',
    outcome: 'authorised' | 'refused',
    failureCategory = 'payment_method_declined',
  ) => {
    if (!order) return;
    setBusy(true);
    setError('');
    if (outcome === 'authorised' && failedAttemptId)
      trackEvent({
        eventName: 'recovery_started',
        sessionId,
        orderId: order.id,
        paymentMethod: method,
        campaign,
        experimentVariant: experiment.variant,
      });
    try {
      const response = await fetch('/api/payments/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          method,
          outcome,
          failureCategory,
          recoveredFromAttemptId:
            outcome === 'authorised' && failedAttemptId
              ? failedAttemptId
              : undefined,
        }),
      });
      const result = (await response.json()) as {
        error?: string;
        attempt?: { id: string };
      };
      if (!response.ok || !result.attempt) throw new Error(result.error);
      if (outcome === 'refused') {
        setFailedAttemptId(result.attempt.id);
        trackEvent({
          eventName: 'payment_failed',
          sessionId,
          orderId: order.id,
          paymentMethod: method,
          campaign,
        });
        const [advice, assignment] = await Promise.all([
          fetch(
            `/api/recovery/recommendation?orderId=${encodeURIComponent(order.id)}`,
          ).then((value) => value.json() as Promise<RecoveryDecision>),
          fetch(
            `/api/experiments/recovery-message?sessionId=${encodeURIComponent(sessionId)}`,
          ).then(
            (value) =>
              value.json() as Promise<{ variant: string; message: string }>,
          ),
        ]);
        setRecommendation(advice);
        setExperiment(assignment);
        trackEvent({
          eventName: 'recovery_offered',
          sessionId,
          orderId: order.id,
          paymentMethod: advice.recommendedMethod ?? undefined,
          campaign,
          experimentVariant: assignment.variant,
        });
        setStage('failed');
      } else {
        trackEvent({
          eventName: 'payment_completed',
          sessionId,
          orderId: order.id,
          paymentMethod: method,
          campaign,
          experimentVariant: failedAttemptId ? experiment.variant : undefined,
        });
        setStage('paid');
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Simulation failed.');
    } finally {
      setBusy(false);
    }
  };
  const startAdyen = async () => {
    if (!order) return;
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/adyen/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id }),
      });
      const result = (await response.json()) as {
        error?: string;
        session?: { id: string; sessionData: string };
        clientKey?: string;
      };
      if (!response.ok || !result.session || !result.clientKey)
        throw new Error(result.error);
      trackEvent({
        eventName: 'recovery_started',
        sessionId,
        orderId: order.id,
        paymentMethod: 'adyen_dropin',
        campaign,
      });
      setAdyenSession({ session: result.session, clientKey: result.clientKey });
      setStage('adyen');
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Adyen checkout could not be started.',
      );
    } finally {
      setBusy(false);
    }
  };
  const close = (next: boolean) => {
    onOpenChange(next);
    if (!next) {
      setStage('details');
      setOrder(null);
      setFailedAttemptId('');
      setError('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {stage === 'details'
              ? 'Create your test order'
              : stage === 'choose'
                ? `Order ${order?.id}`
                : stage === 'adyen'
                  ? 'Secure Adyen checkout'
                  : stage === 'processing'
                    ? 'Confirming your payment'
                    : stage === 'failed'
                      ? 'Recovery decision'
                      : 'Payment recovered'}
          </DialogTitle>
          <DialogDescription>
            {stage === 'details'
              ? 'Customer details are stored with the order; payment credentials are never stored.'
              : stage === 'choose'
                ? `${formatMoney(order?.totalMinor ?? 0)} calculated by the server.`
                : stage === 'adyen'
                  ? 'Payment details are collected securely by Adyen and never pass through PayRecover.'
                  : stage === 'processing'
                    ? 'The final order status is confirmed by a signed Adyen webhook.'
                    : stage === 'failed'
                      ? 'PayRecover classified the failure before deciding what to do next.'
                      : 'The retry is linked to the original failed payment attempt.'}
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
            {error}
          </p>
        )}
        {stage === 'details' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="customer-name">Customer name</Label>
              <Input
                id="customer-name"
                className="mt-1.5"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="customer-email">Email</Label>
              <Input
                id="customer-email"
                type="email"
                className="mt-1.5"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <Button
              className="w-full"
              disabled={busy || !name || !email || !items.length}
              onClick={createOrder}
            >
              {busy && <LoaderCircle className="animate-spin" />} Create order
            </Button>
          </div>
        )}
        {stage === 'choose' && (
          <div className="grid gap-3">
            {adyenConfigured && (
              <Button
                className="h-auto justify-start p-4"
                disabled={busy}
                onClick={startAdyen}
              >
                <CreditCard />
                <span className="text-left">
                  <strong className="block">
                    Pay with Adyen test checkout
                  </strong>
                  <small className="text-primary-foreground/75">
                    Real Drop-in · test payments only
                  </small>
                </span>
              </Button>
            )}
            <Button
              variant="outline"
              className="h-auto justify-start p-4"
              disabled={busy}
              onClick={() => simulate('card', 'refused')}
            >
              <CreditCard />
              <span className="text-left">
                <strong className="block">Simulate declined card</strong>
                <small className="text-muted-foreground">
                  Recovery rule: offer UPI now
                </small>
              </span>
            </Button>
            <Button
              variant="outline"
              className="h-auto justify-start p-4"
              disabled={busy}
              onClick={() => simulate('card', 'refused', 'insufficient_funds')}
            >
              <IndianRupee />
              <span className="text-left">
                <strong className="block">Simulate insufficient funds</strong>
                <small className="text-muted-foreground">
                  Recovery rule: alternative source or later
                </small>
              </span>
            </Button>
            <Button
              variant="outline"
              className="h-auto justify-start p-4"
              disabled={busy}
              onClick={() => simulate('card', 'refused', 'risk_blocked')}
            >
              <CircleAlert />
              <span className="text-left">
                <strong className="block">Simulate risk block</strong>
                <small className="text-muted-foreground">
                  Safety rule: do not retry
                </small>
              </span>
            </Button>
            {!adyenConfigured && (
              <p className="rounded-xl bg-blue-50 p-3 text-xs leading-5 text-blue-800">
                Adyen is not configured, so these scenarios use the safe
                learning simulator.
              </p>
            )}
          </div>
        )}
        {stage === 'adyen' && adyenSession && (
          <AdyenCheckoutPanel
            session={adyenSession.session}
            clientKey={adyenSession.clientKey}
            onCompleted={() => setStage('processing')}
            onError={setError}
          />
        )}
        {stage === 'processing' && (
          <div className="rounded-2xl border bg-muted/50 p-5 text-center">
            <LoaderCircle className="mx-auto size-8 animate-spin text-primary" />
            <p className="mt-3 font-semibold">
              Waiting for secure confirmation
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Adyen&apos;s signed webhook will update the merchant dashboard.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => close(false)}
            >
              Return to store
            </Button>
          </div>
        )}
        {stage === 'failed' && (
          <div
            className={`rounded-2xl border p-4 ${recommendation.eligible ? 'border-amber-200 bg-amber-50' : 'border-rose-200 bg-rose-50'}`}
          >
            <div className="mb-3 flex gap-2">
              <Badge variant="outline" className="bg-white">
                {recommendation.timing === 'later'
                  ? 'Retry later'
                  : recommendation.eligible
                    ? 'Eligible now'
                    : 'Blocked'}
              </Badge>
              {recommendation.eligible && (
                <Badge variant="outline" className="bg-white">
                  Experiment: {experiment.variant}
                </Badge>
              )}
            </div>
            <p
              className={
                recommendation.eligible
                  ? 'font-semibold text-amber-950'
                  : 'font-semibold text-rose-950'
              }
            >
              {recommendation.label}
            </p>
            <p
              className={`mt-1 text-sm leading-6 ${recommendation.eligible ? 'text-amber-800' : 'text-rose-800'}`}
            >
              {recommendation.reason}
            </p>
            {recommendation.eligible ? (
              <Button
                className="mt-4 h-auto min-h-10 w-full whitespace-normal"
                disabled={busy}
                onClick={() =>
                  simulate(
                    recommendation.recommendedMethod === 'card'
                      ? 'card'
                      : 'upi',
                    'authorised',
                  )
                }
              >
                {busy ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <RefreshCcw />
                )}{' '}
                {experiment.message}
              </Button>
            ) : (
              <Button
                variant="outline"
                className="mt-4 w-full"
                onClick={() => close(false)}
              >
                Close order safely
              </Button>
            )}
          </div>
        )}
        {stage === 'paid' && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-full bg-emerald-600 text-white">
              <Check />
            </span>
            <p className="mt-3 font-semibold text-emerald-950">
              Order {order?.id} is paid
            </p>
            <p className="mt-1 text-sm text-emerald-700">
              Return to the dashboard to see the persisted result.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => close(false)}
            >
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Quantity({
  value,
  onMinus,
  onPlus,
}: {
  value: number;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon-sm"
        onClick={onMinus}
        aria-label="Decrease quantity"
      >
        <Minus />
      </Button>
      <span className="w-5 text-center text-sm font-semibold">{value}</span>
      <Button
        variant="outline"
        size="icon-sm"
        onClick={onPlus}
        aria-label="Increase quantity"
      >
        <Plus />
      </Button>
    </div>
  );
}
function NavItem({
  icon,
  label,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
    >
      <span className="[&>svg]:size-4">{icon}</span>
      {label}
    </button>
  );
}
function Metric({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <article
      className={`rounded-2xl border p-5 shadow-sm ${accent ? 'border-cyan-200 bg-cyan-50/70' : 'bg-card'}`}
    >
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-sm font-medium">{label}</span>
        <span className="[&>svg]:size-4">{icon}</span>
      </div>
      <p className="mt-4 text-2xl font-bold tracking-tight">{value}</p>
    </article>
  );
}
function Funnel({
  label,
  value,
  percent,
  highlight,
}: {
  label: string;
  value: string;
  percent: number;
  highlight?: boolean;
}) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-sm">
        <span
          className={highlight ? 'font-semibold text-cyan-700' : 'font-medium'}
        >
          {label}
        </span>
        <span className="font-semibold">{value}</span>
      </div>
      <Progress
        value={percent}
        className={`h-2.5 ${highlight ? '[&>div]:bg-cyan-500' : ''}`}
      />
    </div>
  );
}
function RecoveryRules({
  failures,
}: {
  failures: { category: string; count: number }[];
}) {
  const total = failures.reduce((sum, item) => sum + Number(item.count), 0);
  const rules = [
    {
      category: 'payment_method_declined',
      label: 'Declined',
      action: 'Offer UPI now',
    },
    {
      category: 'insufficient_funds',
      label: 'Insufficient funds',
      action: 'Alternative source or 24h',
    },
    {
      category: 'technical_error',
      label: 'Technical',
      action: 'Retry once now',
    },
    {
      category: 'risk_blocked',
      label: 'Risk block',
      action: 'Stop and review',
    },
  ];
  return (
    <section className="rounded-2xl bg-[#111c2d] p-6 text-white shadow-2xl shadow-slate-900/20">
      <div className="flex items-center justify-between">
        <span className="grid size-10 place-items-center rounded-xl bg-white/10">
          <Sparkles className="size-5 text-cyan-300" />
        </span>
        <Badge className="bg-cyan-300 text-slate-950 hover:bg-cyan-300">
          Explainable rules
        </Badge>
      </div>
      <h2 className="mt-5 text-xl font-semibold tracking-[-0.03em]">
        Recovery decision engine
      </h2>
      <div className="mt-4 space-y-3">
        {rules.map((rule) => {
          const count = Number(
            failures.find((item) => item.category === rule.category)?.count ??
              0,
          );
          return (
            <div key={rule.category} className="rounded-xl bg-white/7 p-3">
              <div className="flex justify-between gap-3 text-sm">
                <span className="font-medium">{rule.label}</span>
                <span className="text-cyan-200">
                  {count} {count === 1 ? 'case' : 'cases'}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-300">{rule.action}</p>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-xs text-slate-400">
        {total} classified failed attempts. Risk blocks are never automatically
        retried.
      </p>
    </section>
  );
}
function MarketingAnalytics({ data }: { data: DashboardData | null }) {
  const funnelOrder = [
    'store_viewed',
    'product_added',
    'checkout_started',
    'order_created',
    'payment_failed',
    'recovery_started',
    'payment_completed',
  ];
  const byEvent = new Map(
    (data?.funnel ?? []).map((item) => [item.eventName, Number(item.sessions)]),
  );
  return (
    <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-primary">
            MarTech measurement
          </p>
          <h2 className="mt-1 text-xl font-semibold">
            Campaign and checkout performance
          </h2>
        </div>
        <Badge variant="secondary">Recovery message A/B test</Badge>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_1fr_1fr]">
        <div>
          <h3 className="text-sm font-semibold">Checkout funnel</h3>
          <div className="mt-3 space-y-2">
            {funnelOrder.map((eventName, index) => {
              const sessions = byEvent.get(eventName) ?? 0;
              const first = byEvent.get('store_viewed') ?? 0;
              return (
                <div key={eventName} className="flex items-center gap-3">
                  <span className="w-5 text-xs font-semibold text-muted-foreground">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <div className="mb-1 flex justify-between text-xs">
                      <span>{eventName.replaceAll('_', ' ')}</span>
                      <strong>{sessions}</strong>
                    </div>
                    <Progress
                      value={first ? (sessions / first) * 100 : 0}
                      className="h-1.5"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold">Revenue by campaign</h3>
          <div className="mt-3 space-y-2">
            {(data?.campaigns ?? []).length ? (
              data!.campaigns.map((item) => (
                <div key={item.campaign} className="rounded-xl bg-muted/55 p-3">
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="truncate font-medium">
                      {item.campaign}
                    </span>
                    <strong>{formatMoney(Number(item.revenueMinor))}</strong>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.paidOrders}/{item.orders} orders paid
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No campaign orders yet.
              </p>
            )}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold">Experiment conversion</h3>
          <div className="mt-3 space-y-2">
            {(data?.experiments ?? []).length ? (
              data!.experiments.map((item) => {
                const rate = Number(item.offered)
                  ? Math.round(
                      (Number(item.started) / Number(item.offered)) * 100,
                    )
                  : 0;
                return (
                  <div key={item.variant} className="rounded-xl border p-3">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">
                        {item.variant.replaceAll('_', ' ')}
                      </span>
                      <strong>{rate}%</strong>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.started} starts from {item.offered} offers
                    </p>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">
                Run recovery journeys to compare messages.
              </p>
            )}
          </div>
          <h3 className="mt-5 text-sm font-semibold">Method conversion</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {(data?.methods ?? []).map((item) => (
              <Badge key={item.method} variant="outline">
                {item.method}:{' '}
                {Number(item.attempts)
                  ? Math.round(
                      (Number(item.authorised) / Number(item.attempts)) * 100,
                    )
                  : 0}
                %
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
function DemoReset() {
  const [busy, setBusy] = useState(false);
  const reset = async () => {
    setBusy(true);
    const response = await fetch('/api/demo/reset', { method: 'DELETE' });
    if (response.ok) window.location.reload();
    else setBusy(false);
  };
  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="outline" size="sm" />}>
        <Trash2 /> Reset demo data
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset all demo activity?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes test orders, payment attempts, webhook
            records, and analytics events. The product catalogue remains
            available.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={busy}
            onClick={() => void reset()}
          >
            {busy ? <LoaderCircle className="animate-spin" /> : <Trash2 />}{' '}
            Reset demo data
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
function AttemptTable({
  attempts,
  loading,
}: {
  attempts: Attempt[];
  loading: boolean;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="border-b px-5 py-4 sm:px-6">
        <h2 className="font-semibold">Recent payment attempts</h2>
        <p className="text-sm text-muted-foreground">
          Every failure, recommendation, and retry stays linked to its order.
        </p>
      </div>
      {loading ? (
        <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
          <LoaderCircle className="size-4 animate-spin" /> Loading stored
          attempts…
        </div>
      ) : attempts.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          No attempts yet. Create one from the demo store.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-muted/55 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-6 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-6 py-3">Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {attempts.map((attempt) => (
                <tr key={attempt.id}>
                  <td className="px-6 py-4 font-semibold">{attempt.orderId}</td>
                  <td className="px-4 py-4">{attempt.customer}</td>
                  <td className="px-4 py-4 uppercase text-muted-foreground">
                    {attempt.method}
                  </td>
                  <td className="px-4 py-4">
                    {formatMoney(attempt.amountMinor)}
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      variant="outline"
                      className={
                        attempt.status === 'authorised'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-rose-200 bg-rose-50 text-rose-700'
                      }
                    >
                      {attempt.recoveredFromAttemptId
                        ? 'Recovered'
                        : attempt.status}
                    </Badge>
                    {attempt.failureCategory && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {attempt.failureCategory.replaceAll('_', ' ')}
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
