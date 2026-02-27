import React, { useState } from 'react';

const App_Minimal: React.FC = () => {
    const [count, setCount] = useState(0);

    return (
        <div style={{ padding: 40, fontFamily: 'sans-serif' }}>
            <h1>Sistema Minimal (Modo de Recuperação)</h1>
            <p>Se você está vendo esta tela, o React e o Vite estão funcionando corretamente.</p>
            <div style={{ marginTop: 20 }}>
                <p>Contador de Teste: {count}</p>
                <button
                    onClick={() => setCount(c => c + 1)}
                    style={{ padding: '10px 20px', fontSize: 16, cursor: 'pointer' }}
                >
                    Incrementar
                </button>
            </div>
        </div>
    );
};

export default App_Minimal;
