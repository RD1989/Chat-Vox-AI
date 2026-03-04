import { Link } from "react-router-dom";
import { ArrowLeft, Shield, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12 max-w-3xl">
        <Link to="/">
          <Button variant="ghost" size="sm" className="mb-8">
            <ArrowLeft size={14} className="mr-2" />
            Voltar
          </Button>
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <Shield size={28} className="text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Política de Privacidade</h1>
        </div>

        <p className="text-xs text-muted-foreground mb-10">
          Última atualização: {new Date().toLocaleDateString("pt-BR")}
        </p>

        <div className="prose prose-sm max-w-none space-y-8 text-foreground/80">
          <section>
            <h2 className="text-lg font-semibold text-foreground">1. Introdução</h2>
            <p className="text-sm leading-relaxed">
              Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos seus dados pessoais, 
              em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">2. Dados Coletados</h2>
            <p className="text-sm leading-relaxed">Podemos coletar os seguintes dados pessoais:</p>
            <ul className="text-sm space-y-1 list-disc pl-5">
              <li>Nome completo</li>
              <li>Endereço de e-mail</li>
              <li>Número de telefone/WhatsApp</li>
              <li>Dados de navegação (IP, cookies, páginas visitadas)</li>
              <li>Mensagens enviadas via chat</li>
              <li>Dados de origem (UTM parameters)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">3. Finalidade do Tratamento</h2>
            <p className="text-sm leading-relaxed">Seus dados são utilizados para:</p>
            <ul className="text-sm space-y-1 list-disc pl-5">
              <li>Atendimento e comunicação com você</li>
              <li>Agendamento de consultas e procedimentos</li>
              <li>Envio de informações sobre serviços</li>
              <li>Melhoria da experiência de navegação</li>
              <li>Análises estatísticas internas</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">4. Base Legal (Art. 7º LGPD)</h2>
            <p className="text-sm leading-relaxed">
              O tratamento dos seus dados pessoais é realizado com base no seu consentimento, 
              na execução de contrato ou para atender aos interesses legítimos do controlador, 
              sempre respeitando os seus direitos fundamentais.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">5. Compartilhamento de Dados</h2>
            <p className="text-sm leading-relaxed">
              Seus dados podem ser compartilhados com prestadores de serviços essenciais 
              (hospedagem, processamento de dados) que seguem padrões adequados de segurança. 
              Não vendemos nem comercializamos seus dados pessoais.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">6. Seus Direitos (Art. 18 LGPD)</h2>
            <p className="text-sm leading-relaxed">Você tem direito a:</p>
            <ul className="text-sm space-y-1 list-disc pl-5">
              <li>Confirmar a existência de tratamento de dados</li>
              <li>Acessar seus dados pessoais</li>
              <li>Corrigir dados incompletos ou desatualizados</li>
              <li>Solicitar a anonimização ou eliminação de dados desnecessários</li>
              <li>Solicitar a portabilidade dos dados</li>
              <li>Revogar o consentimento a qualquer momento</li>
              <li><strong>Solicitar a exclusão dos seus dados pessoais</strong></li>
            </ul>
            <p className="text-sm leading-relaxed mt-3">
              Para exercer qualquer desses direitos, acesse a página{" "}
              <Link to="/exclusao-dados" className="text-primary font-medium hover:underline">
                Solicitar Exclusão de Dados
              </Link>{" "}
              ou entre em contato pelo e-mail abaixo.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">7. Retenção de Dados</h2>
            <p className="text-sm leading-relaxed">
              Seus dados pessoais serão mantidos apenas pelo tempo necessário para cumprir as finalidades 
              para as quais foram coletados, salvo obrigação legal de retenção.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">8. Segurança</h2>
            <p className="text-sm leading-relaxed">
              Adotamos medidas técnicas e organizacionais adequadas para proteger seus dados pessoais 
              contra acessos não autorizados, destruição, perda ou alteração.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">9. Cookies</h2>
            <p className="text-sm leading-relaxed">
              Utilizamos cookies para melhorar sua experiência de navegação. Você pode gerenciar 
              suas preferências de cookies a qualquer momento através do banner de consentimento 
              exibido no site.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">10. Contato do Encarregado (DPO)</h2>
            <div className="flex items-center gap-2 text-sm mt-2">
              <Mail size={14} className="text-primary" />
              <a href="mailto:privacidade@espacojoiceramos.com" className="text-primary hover:underline">
                privacidade@espacojoiceramos.com
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
