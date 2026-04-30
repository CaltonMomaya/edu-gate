import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, GraduationCap } from 'lucide-react';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/welcome" className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold"><span className="text-blue-600">EDU</span><span className="text-emerald-600"> GATE</span></span>
          </Link>
          <div className="flex gap-4">
            <Link href="/login"><Button variant="ghost">Sign In</Button></Link>
            <Link href="/register"><Button className="bg-gradient-to-r from-blue-600 to-emerald-600">Get Started</Button></Link>
          </div>
        </div>
      </nav>

      <div className="py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Simple, Transparent Pricing</h1>
          <p className="text-slate-500 text-lg">All prices in Kenyan Shillings. Start with a 14-day free trial.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto px-6">
          {[
            { name: 'Starter', price: '2,900', limit: '200 students', features: ['Student Management', 'Library Module', 'Basic Reports', 'Email Support'], popular: false },
            { name: 'Standard', price: '7,900', limit: '500 students', features: ['Everything in Starter', 'Leave Management', 'Clearance System', 'Black Book', 'SMS Alerts', 'Parent Portal'], popular: true },
            { name: 'Premium', price: '14,900', limit: 'Unlimited', features: ['Everything in Standard', 'Priority Support', 'Custom Branding', 'API Access', 'Dedicated Manager'], popular: false },
          ].map((p, i) => (
            <Card key={i} className={`border-0 shadow-lg relative ${p.popular ? 'ring-2 ring-blue-500' : ''}`}>
              {p.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">Most Popular</div>}
              <CardHeader>
                <CardTitle className="text-xl">{p.name}</CardTitle>
                <div className="mt-2"><span className="text-4xl font-bold">KES {p.price}</span><span className="text-slate-500">/mo</span></div>
                <p className="text-sm text-slate-500">{p.limit}</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  {p.features.map((f, j) => <li key={j} className="flex items-center gap-2 text-sm"><CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />{f}</li>)}
                </ul>
                <Link href="/register"><Button className="w-full" variant={p.popular ? 'default' : 'outline'}>Start Free Trial</Button></Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
