import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wrench, Eye, EyeOff, AlertCircle, Cog, Zap, Shield, BarChart3 } from 'lucide-react';

function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full opacity-20"
          style={{
            width: `${Math.random() * 6 + 2}px`,
            height: `${Math.random() * 6 + 2}px`,
            background: i % 3 === 0 ? '#f97316' : i % 3 === 1 ? '#fb923c' : '#fdba74',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `float-particle ${Math.random() * 10 + 10}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      ))}
    </div>
  );
}

function AnimatedGear({ size, top, left, duration, delay, opacity }: { size: number; top: string; left: string; duration: number; delay: number; opacity: number }) {
  return (
    <div className="absolute pointer-events-none" style={{ top, left, opacity }}>
      <Cog style={{ width: size, height: size, color: '#f97316', animation: `spin-gear ${duration}s linear infinite`, animationDelay: `${delay}s` }} />
    </div>
  );
}

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (isAuthenticated) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const success = await login(email, password);
      if (!success) setError('Credenciales incorrectas. Intente nuevamente.');
    } catch {
      setError('Error al iniciar sesión. Intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    { icon: Wrench, title: 'Órdenes de Trabajo', desc: 'Control total de mecánicos y reparaciones' },
    { icon: Zap, title: 'Inventario en Tiempo Real', desc: 'Stock de repuestos siempre actualizado' },
    { icon: Shield, title: 'Gestión de Clientes', desc: 'Historial completo de servicios' },
    { icon: BarChart3, title: 'Reportes Financieros', desc: 'Control de ingresos y egresos' },
  ];

  return (
    <>
      <style>{`
        @keyframes float-particle {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          25% { transform: translateY(-30px) translateX(15px); }
          50% { transform: translateY(-10px) translateX(-10px); }
          75% { transform: translateY(-40px) translateX(5px); }
        }
        @keyframes spin-gear { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes slide-up { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slide-right { from { opacity: 0; transform: translateX(-30px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 20px rgba(249,115,22,0.15); } 50% { box-shadow: 0 0 40px rgba(249,115,22,0.3); } }
        @keyframes logo-bounce { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        .anim-slide-up { animation: slide-up 0.8s ease-out forwards; }
        .anim-slide-right { animation: slide-right 0.8s ease-out forwards; }
        .anim-fade-in { animation: fade-in 1s ease-out forwards; }
        .anim-pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
        .anim-logo-bounce { animation: logo-bounce 2s ease-in-out infinite; }
        .feature-card { transition: all 0.3s cubic-bezier(0.4,0,0.2,1); }
        .feature-card:hover { transform: translateY(-4px); background: rgba(249,115,22,0.1); border-color: rgba(249,115,22,0.3); }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 relative">
        <FloatingParticles />
        <AnimatedGear size={120} top="5%" left="5%" duration={20} delay={0} opacity={0.06} />
        <AnimatedGear size={80} top="15%" left="12%" duration={15} delay={2} opacity={0.04} />
        <AnimatedGear size={60} top="70%" left="85%" duration={12} delay={1} opacity={0.06} />
        <AnimatedGear size={100} top="80%" left="8%" duration={18} delay={3} opacity={0.04} />

        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-12 items-center relative z-10">
          {/* Left Side - Branding */}
          <div className={`text-white space-y-8 hidden lg:block ${mounted ? 'anim-slide-right' : 'opacity-0'}`}>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30 anim-logo-bounce">
                <Wrench className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-5xl font-black tracking-tight">RUDOLF</h1>
                <p className="text-orange-400/80 text-sm font-medium tracking-widest uppercase">Sistema ERP para Taller de Motos</p>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white/90 mb-2">Gestión completa de tu taller</h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Controla órdenes, inventario, clientes y finanzas desde una sola plataforma diseñada para talleres de motos.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {features.map((feat, i) => (
                <div
                  key={feat.title}
                  className="feature-card p-4 rounded-xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm"
                  style={{ animation: mounted ? `slide-up 0.6s ease-out ${0.2 + i * 0.1}s forwards` : 'none', opacity: 0 }}
                >
                  <feat.icon className="w-6 h-6 text-orange-400 mb-2" />
                  <p className="text-sm font-semibold text-white/90">{feat.title}</p>
                  <p className="text-xs text-slate-400 mt-1">{feat.desc}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full">
                <span className="text-xs text-orange-400 font-medium">v3.0</span>
              </div>
              <span className="text-xs text-slate-500">Firebase + Netlify</span>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className={mounted ? 'anim-slide-up' : 'opacity-0'}>
            <Card className="w-full max-w-md mx-auto shadow-2xl border-slate-200/50 anim-pulse-glow">
              <CardHeader className="space-y-1 text-center pb-4">
                <div className="flex justify-center lg:hidden mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30 anim-logo-bounce">
                    <Wrench className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="lg:hidden mb-2">
                  <h1 className="text-2xl font-black text-slate-900">RUDOLF</h1>
                  <p className="text-xs text-slate-500 tracking-widest uppercase">ERP Taller de Motos</p>
                </div>
                <CardTitle className="text-2xl font-bold">Iniciar Sesión</CardTitle>
                <CardDescription>Ingresa tus credenciales para acceder al sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive" className="anim-fade-in">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email">Correo electrónico</Label>
                    <Input id="email" type="email" placeholder="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11 transition-all focus:ring-2 focus:ring-orange-500/20" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <div className="relative">
                      <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-11 pr-10 transition-all focus:ring-2 focus:ring-orange-500/20" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="rounded border-slate-300" />
                      <span className="text-slate-600">Recordarme</span>
                    </label>
                    <a href="#" className="text-orange-600 hover:text-orange-700 font-medium transition-colors">¿Olvidaste tu contraseña?</a>
                  </div>

                  <Button type="submit" className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/25 transition-all hover:shadow-orange-500/40 text-base font-semibold" disabled={isLoading}>
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Ingresando...</span>
                      </div>
                    ) : 'Ingresar al Sistema'}
                  </Button>
                </form>

                <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                  <p className="text-xs text-slate-400">Solicite sus credenciales al administrador del sistema</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
