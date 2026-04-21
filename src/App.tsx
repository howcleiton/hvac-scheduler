import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Play, 
  Layout, 
  AlertCircle,
  Timer,
  Car
} from 'lucide-react';
import { gerarCronograma } from './lib/scheduler';
import type { ScheduleParams, ScheduleResult } from './lib/scheduler';

const App: React.FC = () => {
  const [params, setParams] = useState<ScheduleParams>({
    startJourney: '07:40',
    startLunch: '12:50',
    endLunch: '14:15',
    endJourney: '17:00',
    totalOrders: 15,
    travelTime: 5,
  });

  const [result, setResult] = useState<ScheduleResult | null>(null);
  const [completedOrders, setCompletedOrders] = useState<number[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setParams(prev => ({
      ...prev,
      [name]: name === 'totalOrders' || name === 'travelTime' 
        ? parseInt(value) || 0 
        : value
    }));
  };

  const calculate = () => {
    const res = gerarCronograma(params);
    setResult(res);
    setCompletedOrders([]);
  };

  const toggleOrderCompletion = (equipamento: number) => {
    setCompletedOrders(prev => 
      prev.includes(equipamento)
        ? prev.filter(id => id !== equipamento)
        : [...prev, equipamento]
    );
  };

  // Initial calculation
  useEffect(() => {
    calculate();
  }, []);

  return (
    <div className="container">
      {/* Sidebar - Inputs */}
      <aside className="panel">
        <h1 className="title">
          <Calendar size={28} color="#6366f1" />
          HVAC Scheduler
        </h1>

        <div className="form-section">
          <h2 className="subtitle">Configuração da Jornada</h2>
          
          <div className="input-row">
            <div className="form-group">
              <label><Clock size={14} style={{marginRight: 4}} /> Início</label>
              <input 
                type="time" 
                name="startJourney" 
                value={params.startJourney} 
                onChange={handleInputChange} 
              />
            </div>
            <div className="form-group">
              <label><Timer size={14} style={{marginRight: 4}} /> Fim</label>
              <input 
                type="time" 
                name="endJourney" 
                value={params.endJourney} 
                onChange={handleInputChange} 
              />
            </div>
          </div>

          <div className="input-row">
            <div className="form-group">
              <label>Início Almoço</label>
              <input 
                type="time" 
                name="startLunch" 
                value={params.startLunch} 
                onChange={handleInputChange} 
              />
            </div>
            <div className="form-group">
              <label>Fim Almoço</label>
              <input 
                type="time" 
                name="endLunch" 
                value={params.endLunch} 
                onChange={handleInputChange} 
              />
            </div>
          </div>

          <h2 className="subtitle" style={{marginTop: '2rem'}}>Detalhes do Serviço</h2>
          
          <div className="input-row">
            <div className="form-group">
              <label>Total de OS</label>
              <input 
                type="number" 
                name="totalOrders" 
                value={params.totalOrders} 
                onChange={handleInputChange} 
              />
            </div>
            <div className="form-group">
              <label><Car size={14} style={{marginRight: 4}} /> Desloc. (min)</label>
              <input 
                type="number" 
                name="travelTime" 
                value={params.travelTime} 
                onChange={handleInputChange} 
              />
            </div>
          </div>

          <button onClick={calculate}>
            <Play size={18} fill="currentColor" />
            Gerar Cronograma
          </button>
        </div>
      </aside>

      {/* Main Content - Results */}
      <main className="schedule-container">
        {result && (
          <>
            <div className="summary-cards">
              <div className="card">
                <div className="card-label">Executadas</div>
                <div className="card-value success">{completedOrders.length}</div>
              </div>
              <div className="card">
                <div className="card-label">Pendentes</div>
                <div className="card-value warning">{result.schedule.length - completedOrders.length}</div>
              </div>
              <div className="card">
                <div className="card-label">Tempo Total</div>
                <div className="card-value">
                  {Math.floor(result.summary.totalTimeWorkedMinutes / 60)}h {result.summary.totalTimeWorkedMinutes % 60}m
                </div>
              </div>
            </div>

            <div className="panel" style={{flex: 1}}>
              <h2 className="subtitle" style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <Layout size={20} />
                Ordens de Serviço
              </h2>

              {result.beforeLunch.length > 0 && (
                <>
                  <div className="section-divider">--- Antes do Almoço ---</div>
                  <div className="schedule-list">
                    {result.beforeLunch.map((item) => (
                      <div key={item.equipamento} className={`schedule-item ${completedOrders.includes(item.equipamento) ? 'completed' : ''}`}>
                        <div className="item-info">
                          <span className="item-name">Equipamento {item.equipamento} <span style={{opacity: 0.6, fontSize: '0.8rem', marginLeft: '6px', fontWeight: 'normal'}}>({item.duracao})</span></span>
                          <span className="item-time">{item.inicio} - {item.fim}</span>
                        </div>
                        <input 
                          type="checkbox" 
                          className="custom-checkbox"
                          checked={completedOrders.includes(item.equipamento)}
                          onChange={() => toggleOrderCompletion(item.equipamento)}
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}

              {result.afterLunch.length > 0 && (
                <>
                  <div className="section-divider" style={{marginTop: '2rem'}}>--- Após o Almoço ---</div>
                  <div className="schedule-list">
                    {result.afterLunch.map((item) => (
                      <div key={item.equipamento} className={`schedule-item ${completedOrders.includes(item.equipamento) ? 'completed' : ''}`}>
                        <div className="item-info">
                          <span className="item-name">Equipamento {item.equipamento} <span style={{opacity: 0.6, fontSize: '0.8rem', marginLeft: '6px', fontWeight: 'normal'}}>({item.duracao})</span></span>
                          <span className="item-time">{item.inicio} - {item.fim}</span>
                        </div>
                        <input 
                          type="checkbox" 
                          className="custom-checkbox"
                          checked={completedOrders.includes(item.equipamento)}
                          onChange={() => toggleOrderCompletion(item.equipamento)}
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}

              {result.schedule.length === 0 && (
                <div style={{textAlign: 'center', padding: '3rem', color: '#94a3b8'}}>
                  <AlertCircle size={48} style={{marginBottom: '1rem', opacity: 0.2}} />
                  <p>Nenhuma ordem pôde ser agendada com estes parâmetros.</p>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default App;
