import { formatMoney } from './formatters';
import { useState } from 'react';
type Service = { id: string; name: string; price: number; minutes: number; active: number };

export default function PromoCard({
  services,
  choose,
}: {
  services: Service[];
  choose: (id: string) => void;
}) {
  const [tab, setTab] = useState('services');
  const combo = services.find((s) => s.id === 'combo' && s.active);
  return (
    <div className="quote promo-card">
      <div className="promo-mark" aria-hidden="true">
        ♛
      </div>
      <div className="promo-tabs" role="tablist" aria-label="Destaques da King Barber">
        {[
          ['services', 'Serviços'],
          ['offers', 'Promoções'],
          ['soon', 'Em breve'],
        ].map(([id, label]) => (
          <button
            key={id}
            id={'promo-tab-' + id}
            role="tab"
            aria-selected={tab === id}
            aria-controls="promo-content"
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div id="promo-content" role="tabpanel" aria-labelledby={'promo-tab-' + tab}>
        {tab === 'services' && (
          <>
            <h3>Cuidado do seu jeito.</h3>
            <p>Escolha seu próximo atendimento.</p>
            <div className="promo-services">
              {services
                .filter((s) => s.active)
                .map((s) => (
                  <button key={s.id} onClick={() => choose(s.id)}>
                    <span>
                      {s.name}
                      <small>{s.minutes} minutos</small>
                    </span>
                    <strong>{formatMoney(s.price)} ↗</strong>
                  </button>
                ))}
            </div>
          </>
        )}
        {tab === 'offers' && (
          <>
            <span className="promo-kicker">COMBO EM DESTAQUE</span>
            <h3>
              Dois cuidados.
              <br />
              Um só horário.
            </h3>
            {combo ? (
              <>
                <p>Cabelo e barba alinhados para renovar o visual.</p>
                <div className="promo-price">
                  {formatMoney(combo.price)}
                  <small>Preço do combo · {combo.minutes} minutos</small>
                </div>
                <button className="primary" onClick={() => choose(combo.id)}>
                  Agendar o combo →
                </button>
              </>
            ) : (
              <p>Novas promoções serão anunciadas por aqui. Fique de olho!</p>
            )}
          </>
        )}
        {tab === 'soon' && (
          <>
            <span className="promo-kicker">NOVIDADES EM BREVE</span>
            <h3>O próximo capítulo do seu estilo.</h3>
            <p>Novas experiências e condições especiais estão chegando à King Barber.</p>
            <div className="coming-soon">
              <span aria-hidden="true">♔</span>
              <strong>Novos pacotes de cuidado</strong>
              <small>Em breve, mais opções para completar sua experiência.</small>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
