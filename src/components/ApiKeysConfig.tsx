import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Key, Info } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface ApiKeysConfigProps {
  onSave: (keys: {
    locationiq?: string;
    positionstack?: string;
    opencage?: string;
    google?: string;
    mapbox?: string;
    here?: string;
  }) => void;
}

export const ApiKeysConfig = ({ onSave }: ApiKeysConfigProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [keys, setKeys] = useState({
    locationiq: localStorage.getItem('locationiq_key') || '',
    positionstack: localStorage.getItem('positionstack_key') || '',
    opencage: localStorage.getItem('opencage_key') || '',
    google: localStorage.getItem('google_key') || '',
    mapbox: localStorage.getItem('mapbox_key') || '',
    here: localStorage.getItem('here_key') || ''
  });

  const handleSave = () => {
    localStorage.setItem('locationiq_key', keys.locationiq);
    localStorage.setItem('positionstack_key', keys.positionstack);
    localStorage.setItem('opencage_key', keys.opencage);
    localStorage.setItem('google_key', keys.google);
    localStorage.setItem('mapbox_key', keys.mapbox);
    localStorage.setItem('here_key', keys.here);
    onSave(keys);
    setIsOpen(false);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="p-6 bg-secondary/30">
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              Configurar API Keys (Opcional - Aumenta Limite)
            </div>
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-4 space-y-4">
          <div className="bg-primary/5 p-3 rounded-lg flex gap-2">
            <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Configure APIs pagas para processar grandes volumes. Google Maps (40k/dia), Mapbox (100k/mês) e Here Maps (250k/mês) oferecem limites muito superiores às APIs gratuitas.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="locationiq">
                LocationIQ API Key
                <span className="text-xs text-muted-foreground ml-2">(5.000 req/dia grátis)</span>
              </Label>
              <Input
                id="locationiq"
                type="password"
                placeholder="pk.xxx..."
                value={keys.locationiq}
                onChange={(e) => setKeys({ ...keys, locationiq: e.target.value })}
              />
              <a
                href="https://locationiq.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline"
              >
                Obter chave gratuita →
              </a>
            </div>

            <div>
              <Label htmlFor="positionstack">
                Positionstack API Key
                <span className="text-xs text-muted-foreground ml-2">(25.000 req/mês grátis)</span>
              </Label>
              <Input
                id="positionstack"
                type="password"
                placeholder="xxx..."
                value={keys.positionstack}
                onChange={(e) => setKeys({ ...keys, positionstack: e.target.value })}
              />
              <a
                href="https://positionstack.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline"
              >
                Obter chave gratuita →
              </a>
            </div>

            <div>
              <Label htmlFor="opencage">
                OpenCage API Key
                <span className="text-xs text-muted-foreground ml-2">(2.500 req/dia grátis)</span>
              </Label>
              <Input
                id="opencage"
                type="password"
                placeholder="xxx..."
                value={keys.opencage}
                onChange={(e) => setKeys({ ...keys, opencage: e.target.value })}
              />
              <a
                href="https://opencagedata.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline"
              >
                Obter chave gratuita →
              </a>
            </div>

            <div>
              <Label htmlFor="google">
                Google Maps API Key
                <span className="text-xs text-muted-foreground ml-2">(40.000 req/dia grátis)</span>
              </Label>
              <Input
                id="google"
                type="password"
                placeholder="AIza..."
                value={keys.google}
                onChange={(e) => setKeys({ ...keys, google: e.target.value })}
              />
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline"
              >
                Obter chave →
              </a>
            </div>

            <div>
              <Label htmlFor="mapbox">
                Mapbox API Key
                <span className="text-xs text-muted-foreground ml-2">(100.000 req/mês grátis)</span>
              </Label>
              <Input
                id="mapbox"
                type="password"
                placeholder="pk.xxx..."
                value={keys.mapbox}
                onChange={(e) => setKeys({ ...keys, mapbox: e.target.value })}
              />
              <a
                href="https://account.mapbox.com/access-tokens/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline"
              >
                Obter chave gratuita →
              </a>
            </div>

            <div>
              <Label htmlFor="here">
                Here Maps API Key
                <span className="text-xs text-muted-foreground ml-2">(250.000 req/mês grátis)</span>
              </Label>
              <Input
                id="here"
                type="password"
                placeholder="xxx..."
                value={keys.here}
                onChange={(e) => setKeys({ ...keys, here: e.target.value })}
              />
              <a
                href="https://platform.here.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline"
              >
                Obter chave gratuita →
              </a>
            </div>
          </div>

          <Button onClick={handleSave} className="w-full">
            Salvar Configurações
          </Button>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
