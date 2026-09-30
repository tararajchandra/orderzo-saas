import { redirect } from 'next/navigation';
import Link from 'next/link';

export default function HomePage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
    if (searchParams?.table) {
        redirect(`/menu?table=${searchParams.table}`);
    }
    return (
        <main>
            {/* Hero Section */}
            <section style={{
                minHeight: '90vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '2rem',
                position: 'relative',
                overflow: 'hidden',
            }}>
                <div style={{
                    position: 'absolute',
                    top: '20%',
                    left: '10%',
                    width: '300px',
                    height: '300px',
                    background: 'radial-gradient(circle, rgba(255,100,50,0.2) 0%, transparent 70%)',
                    borderRadius: '50%',
                    filter: 'blur(60px)',
                    animation: 'pulse 4s ease-in-out infinite',
                }} />
                <div style={{
                    position: 'absolute',
                    bottom: '20%',
                    right: '10%',
                    width: '400px',
                    height: '400px',
                    background: 'radial-gradient(circle, rgba(150,50,255,0.2) 0%, transparent 70%)',
                    borderRadius: '50%',
                    filter: 'blur(60px)',
                    animation: 'pulse 5s ease-in-out infinite',
                }} />

                <div className="container" style={{ position: 'relative', zIndex: 1 }}>
                    <div className="fade-in">
                        <h1 style={{ marginBottom: '1.5rem' }}>
                            Experience Culinary Excellence
                        </h1>
                        <p style={{
                            fontSize: '1.25rem',
                            maxWidth: '600px',
                            margin: '0 auto 2.5rem',
                            color: 'var(--text-secondary)',
                        }}>
                            Order authentic, delicious food from the comfort of your home.
                            Fresh ingredients, traditional recipes, delivered with love.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <Link href="/menu" className="btn btn-primary" style={{ fontSize: '1.125rem', padding: '1rem 2rem' }}>
                                Browse Menu
                            </Link>
                            <Link href="/orders" className="btn btn-outline" style={{ fontSize: '1.125rem', padding: '1rem 2rem' }}>
                                Track Order
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="container" style={{ padding: '4rem 1.5rem' }}>
                <h2 className="text-center mb-5">Why Choose OrderZo?</h2>
                <div className="grid grid-3">
                    <div className="glass-card text-center slide-up">
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🍽️</div>
                        <h3>Authentic Flavors</h3>
                        <p>Traditional recipes passed down through generations, prepared with authentic spices and techniques.</p>
                    </div>
                    <div className="glass-card text-center slide-up" style={{ animationDelay: '0.1s' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚀</div>
                        <h3>Fast Delivery</h3>
                        <p>Hot, fresh food delivered to your doorstep within 30-45 minutes. Track your order in real-time.</p>
                    </div>
                    <div className="glass-card text-center slide-up" style={{ animationDelay: '0.2s' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💳</div>
                        <h3>Easy Payment</h3>
                        <p>Multiple payment options including cash, card, UPI, and digital wallets for your convenience.</p>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="container text-center" style={{ padding: '4rem 1.5rem 6rem' }}>
                <div className="glass-card" style={{ maxWidth: '700px', margin: '0 auto', padding: '3rem 2rem' }}>
                    <h2 style={{ marginBottom: '1rem' }}>Ready to Order?</h2>
                    <p style={{ fontSize: '1.125rem', marginBottom: '2rem' }}>
                        Explore our extensive menu and place your order in just a few clicks.
                    </p>
                    <Link href="/menu" className="btn btn-primary" style={{ fontSize: '1.125rem', padding: '1rem 2.5rem' }}>
                        Order Now
                    </Link>
                </div>
            </section>
        </main>
    );
}
