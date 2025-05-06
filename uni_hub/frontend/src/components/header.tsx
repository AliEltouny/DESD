import Link from 'next/link';

export function Header() {
    return (
        <header className="h-[rem]">
            <nav className="flex justify-between align-middle py-4 w-full">
                <div>
                    <Link href="/">
                        <h1 className="text-2xl font-bold select none italic">Notifications</h1>
                    </Link>
                </div>
            </nav>
        </header>
    );
}