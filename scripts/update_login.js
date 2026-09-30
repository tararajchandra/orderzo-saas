const fs = require('fs');

let content = fs.readFileSync('app/login/page.tsx', 'utf8');

const newSubmit = `    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const doLogin = async (payload: any) => {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await response.json();

            if (data.requireLocation) {
                if (navigator.geolocation) {
                    setError('Duty Check: Fetching your GPS location to verify you are at the restaurant...');
                    navigator.geolocation.getCurrentPosition(
                        async (position) => {
                            const { latitude, longitude } = position.coords;
                            await doLogin({ ...formData, lat: latitude, lng: longitude });
                        },
                        (err) => {
                            setError('Location access denied. Staff MUST allow location access to login and mark attendance.');
                            setLoading(false);
                        },
                        { enableHighAccuracy: true, timeout: 10000 }
                    );
                } else {
                    setError('Geolocation is not supported by your browser.');
                    setLoading(false);
                }
                return;
            }

            if (data.success) {
                login(data.data.token, data.data.user);
                if (data.data.user.role === 'admin') {
                    router.push('/admin/dashboard');
                } else if (data.data.user.role === 'salesman') {
                    router.push('/salesman');
                } else if (data.data.user.role === 'delivery_boy') {
                    router.push('/delivery');
                } else if (data.data.user.role === 'kitchen_staff' || data.data.user.role === 'kitchen') {
                    router.push('/kitchen');
                } else {
                    router.push('/menu');
                }
            } else {
                setError(data.error || 'Login failed');
                setLoading(false);
            }
        };

        try {
            await doLogin(formData);
        } catch (error) {
            setError('An error occurred. Please try again.');
            setLoading(false);
        }
    };`;

content = content.replace(/const handleSubmit = async \([^)]+\) => \{[\s\S]*?\} catch \(error\) \{[\s\S]*?finally \{[\s\S]*?\}\n    \};/, newSubmit);

fs.writeFileSync('app/login/page.tsx', content);
