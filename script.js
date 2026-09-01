// ---- Toast helper ----
  const toastEl = document.getElementById('toast');
  let toastTimer;
  function showToast(msg){
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(()=> toastEl.classList.remove('show'), 2200);
  }
  document.querySelectorAll('[data-toast]').forEach(el=>{
    el.addEventListener('click', ()=> showToast(el.getAttribute('data-toast') + ' (exploração de design — sem integração)'));
  });
  document.querySelectorAll('[data-toast-enter]').forEach(el=>{
    el.addEventListener('keydown', (e)=>{
      if(e.key === 'Enter'){ showToast(el.getAttribute('data-toast-enter') + ' (exploração de design — sem integração)'); }
    });
  });

  // ---- Drawer menu ----
  const drawer = document.getElementById('drawer');
  const overlay = document.getElementById('overlay');
  function openDrawer(){ drawer.classList.add('open'); overlay.classList.add('open'); }
  function closeDrawer(){ drawer.classList.remove('open'); overlay.classList.remove('open'); }
  document.getElementById('menuToggleBtn').addEventListener('click', openDrawer);
  document.getElementById('drawerCloseBtn').addEventListener('click', closeDrawer);
  overlay.addEventListener('click', closeDrawer);

  // ---- Tabs ----
  const tabs = document.querySelectorAll('.tab');
  const progressFill = document.getElementById('progressFill');
  const tabOrder = ['cliente','produto','entrega','servicos','pagamento','enderecos'];
  tabs.forEach(tab=>{
    tab.addEventListener('click', ()=>{
      tabs.forEach(t=>t.classList.remove('active'));
      tab.classList.add('active');
      const idx = tabOrder.indexOf(tab.dataset.tab);
      const pct = ((idx+1)/tabOrder.length)*100 - 8;
      progressFill.style.width = Math.max(8,pct) + '%';
      if(tab.dataset.tab !== 'entrega'){
        showToast('Etapa "' + tab.querySelector('span').textContent + '" — tela não incluída nesta exploração');
      }
    });
  });

  // ---- Order 3-dot menu ----
  const orderMenuBtn = document.getElementById('orderMenuBtn');
  const orderMenu = document.getElementById('orderMenu');
  orderMenuBtn.addEventListener('click', (e)=>{
    e.stopPropagation();
    orderMenu.classList.toggle('open');
  });
  document.addEventListener('click', ()=> orderMenu.classList.remove('open'));
  orderMenu.querySelectorAll('button').forEach(b=>{
    b.addEventListener('click', ()=> orderMenu.classList.remove('open'));
  });

  // ---- Client chevron ----
  const clientChevronBtn = document.getElementById('clientChevronBtn');
  clientChevronBtn.addEventListener('click', ()=> clientChevronBtn.classList.toggle('rotated'));

  // ---- Select-all checkbox ----
  const selectAllCheckbox = document.getElementById('selectAllCheckbox');
  const productCheckboxes = document.querySelectorAll('[data-product-checkbox]');
  function setCheckbox(el, checked){
    el.classList.toggle('checked', checked);
    el.innerHTML = checked ? '<svg class="ic"><use href="#i-check"></use></svg>' : '';
  }
  selectAllCheckbox.addEventListener('click', ()=>{
    resetEntregaSelectionIfOpen();
    const willCheck = !selectAllCheckbox.classList.contains('checked');
    setCheckbox(selectAllCheckbox, willCheck);
    document.querySelectorAll('[data-product-checkbox]').forEach(cb=> setCheckbox(cb, willCheck));
    updateEntregaAvailability();
    updateGravarAvailability();
  });
  productCheckboxes.forEach(cb=>{
    cb.addEventListener('click', ()=>{
      resetEntregaSelectionIfOpen();
      setCheckbox(cb, !cb.classList.contains('checked'));
      updateEntregaAvailability();
      updateGravarAvailability();
    });
  });

  // ---- Regras de disponibilidade das opções de entrega ----
  // 1) Só é possível clicar em uma opção de entrega depois que 1+ produtos forem selecionados.
  // 2) "Retira Rápido" só fica disponível se TODOS os produtos selecionados tiverem o selo Full
  //    (se qualquer selecionado não tiver o selo, a opção fica bloqueada).
  const entregaOtherButtons = document.querySelectorAll('.entrega-opt');
  const entregaRapidoBtn = document.querySelector('.entrega-opt-rapido');
  function updateEntregaAvailability(){
    let anySelected = false;
    let allSelectedFull = true;
    document.querySelectorAll('.produto-item').forEach(item=>{
      const cb = item.querySelector('[data-product-checkbox]');
      if(cb && cb.classList.contains('checked')){
        anySelected = true;
        if(item.dataset.full !== 'true') allSelectedFull = false;
      }
    });
    entregaOtherButtons.forEach(btn=> btn.disabled = !anySelected);
    entregaRapidoBtn.disabled = !anySelected || !allSelectedFull;
  }
  updateEntregaAvailability();

  // ---- Retira Rápido / Retira Depósito: abrem o card de detalhe (local retirada + centro de distribuição) ----
  const entregaOptionsView = document.getElementById('entregaOptionsView');
  const entregaDetailView = document.getElementById('entregaDetailView');
  const entregaDetailIcon = document.getElementById('entregaDetailIcon');
  const entregaDetailLabel = document.getElementById('entregaDetailLabel');
  const entregaDepositoBtn = document.getElementById('entregaDepositoBtn');

  // ---- Habilitação do botão "Gravar" ----
  // Só fica habilitado quando 1+ produtos estiverem selecionados E um método de entrega tiver sido
  // confirmado (o card de detalhe de "Retira Rápido"/"Retira Depósito" estiver aberto).
  const btnGravar = document.getElementById('btnGravar');
  function updateGravarAvailability(){
    const anySelected = Array.from(document.querySelectorAll('.produto-item')).some(item=>{
      const cb = item.querySelector('[data-product-checkbox]');
      return cb && cb.classList.contains('checked');
    });
    const methodConfirmed = entregaDetailView.style.display === 'flex';
    btnGravar.disabled = !(anySelected && methodConfirmed);
  }
  updateGravarAvailability();

  const entregaDetailConfig = {
    rapido: { icon: '#i-zap', label: 'Retira Rápido' },
    deposito: { icon: '#i-warehouse', label: 'Retira Depósito' }
  };

  // Dados de retirada por local, específicos de cada opção de entrega (a disponibilidade muda conforme o método)
  const locationDataBySource = {
    rapido: {
      cd107: { label: '107 (CDD) EUNAPOLIS - BA', title: 'Centro de Distribuição (107)', address: ['Rodovia BR 101 KM 720, SN, Urbis I', 'Eunapolis, BA, 45820-001'], disponibilidade: 'A partir de 22/08 - 9hrs' },
      cd113: { label: '113 (CDD) SERRA - ES', title: 'Centro de Distribuição (113)', address: ['4 E, 242, Civit II', 'Serra, ES, 29168-082'], disponibilidade: 'A partir de 23/08 - 10hrs' },
      cd114: { label: '114 (CDD) TEIXEIRA DE FREITAS - BA', title: 'Centro de Distribuição (114)', address: ['Maria Josefa m Almeida, 215, Nova Jerusalem', 'Teixeira de Freitas, BA, 45989-236'], disponibilidade: 'A partir de 24/08 - 9hrs' },
      cd116: { label: '116 (CDD) VITORIA DA CONQUISTA - BA', title: 'Centro de Distribuição (116)', address: ['Ouro Preto, 353, Brasil', 'Vitoria da Conquista, BA, 45051-385'], disponibilidade: 'A partir de 25/08 - 10hrs' }
    },
    deposito: {
      cd107: { label: '107 (CDD) EUNAPOLIS - BA', title: 'Centro de Distribuição (107)', address: ['Rodovia BR 101 KM 720, SN, Urbis I', 'Eunapolis, BA, 45820-001'], disponibilidade: 'A partir de 28/08 - 9hrs' },
      cd113: { label: '113 (CDD) SERRA - ES', title: 'Centro de Distribuição (113)', address: ['4 E, 242, Civit II', 'Serra, ES, 29168-082'], disponibilidade: 'A partir de 29/08 - 10hrs' },
      cd114: { label: '114 (CDD) TEIXEIRA DE FREITAS - BA', title: 'Centro de Distribuição (114)', address: ['Maria Josefa m Almeida, 215, Nova Jerusalem', 'Teixeira de Freitas, BA, 45989-236'], disponibilidade: 'A partir de 30/08 - 9hrs' },
      cd116: { label: '116 (CDD) VITORIA DA CONQUISTA - BA', title: 'Centro de Distribuição (116)', address: ['Ouro Preto, 353, Brasil', 'Vitoria da Conquista, BA, 45051-385'], disponibilidade: 'A partir de 31/08 - 10hrs' }
    }
  };

  const localRetiradaBtn = document.getElementById('localRetiradaBtn');
  const localRetiradaOptions = document.getElementById('localRetiradaOptions');
  const localRetiradaValue = document.getElementById('localRetiradaValue');
  const distribTitle = document.getElementById('distribTitle');
  const distribAddress = document.getElementById('distribAddress');
  const disponibilidadeValue = document.getElementById('disponibilidadeValue');

  let currentEntregaSource = 'rapido';

  function applyLocationData(source, key){
    const data = locationDataBySource[source][key];
    if(!data) return;
    localRetiradaValue.textContent = data.label;
    distribTitle.textContent = data.title;
    distribAddress.innerHTML = data.address.map(l=>'<p>'+l+'</p>').join('');
    disponibilidadeValue.textContent = data.disponibilidade;
  }

  function openEntregaDetail(source){
    const cfg = entregaDetailConfig[source];
    if(!cfg) return;
    currentEntregaSource = source;
    entregaDetailIcon.querySelector('use').setAttribute('href', cfg.icon);
    entregaDetailLabel.textContent = cfg.label;
    applyLocationData(source, 'cd107');
    entregaOptionsView.style.display = 'none';
    entregaDetailView.style.display = 'flex';
  }

  // ---- Loading de 0,5s ao trocar de estado no card "Dados Para Entrega" ----
  // Usado ao: escolher um tipo de entrega, voltar para trocar o método, ou alterar o local de retirada.
  const entregaLoading = document.getElementById('entregaLoading');
  let entregaLoadingActive = false;
  function withEntregaLoading(applyState){
    if(entregaLoadingActive) return;
    entregaLoadingActive = true;
    entregaOptionsView.style.display = 'none';
    entregaDetailView.style.display = 'none';
    entregaLoading.classList.add('active');
    updateGravarAvailability();
    setTimeout(()=>{
      entregaLoading.classList.remove('active');
      applyState();
      updateGravarAvailability();
      entregaLoadingActive = false;
    }, 500);
  }

  entregaRapidoBtn.addEventListener('click', ()=>{
    if(entregaRapidoBtn.disabled) return;
    withEntregaLoading(()=> openEntregaDetail('rapido'));
  });
  entregaDepositoBtn.addEventListener('click', ()=>{
    if(entregaDepositoBtn.disabled) return;
    withEntregaLoading(()=> openEntregaDetail('deposito'));
  });
  document.getElementById('editEntregaDetailBtn').addEventListener('click', ()=>{
    withEntregaLoading(()=>{
      entregaDetailView.style.display = 'none';
      entregaOptionsView.style.display = 'flex';
    });
  });

  // ---- Se o usuário mexer na seleção de produtos depois de já ter escolhido um método de entrega,
  // a entrega escolhida é descartada e ele precisa selecionar o método novamente ----
  function resetEntregaSelectionIfOpen(){
    if(entregaDetailView.style.display === 'flex'){
      entregaDetailView.style.display = 'none';
      entregaOptionsView.style.display = 'flex';
      localRetiradaOptions.classList.remove('open');
    }
  }

  localRetiradaBtn.addEventListener('click', (e)=>{
    e.stopPropagation();
    localRetiradaOptions.classList.toggle('open');
  });
  localRetiradaOptions.querySelectorAll('button').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const loc = btn.dataset.loc;
      localRetiradaOptions.classList.remove('open');
      withEntregaLoading(()=>{
        applyLocationData(currentEntregaSource, loc);
        entregaDetailView.style.display = 'flex';
      });
    });
  });
  document.addEventListener('click', ()=> localRetiradaOptions.classList.remove('open'));

  // ---- Modal: Tratar agendamento ----
  // Regra de negócio: o agendamento de retirada pode ser de até 5 dias úteis
  // após a data "Disponível para retirada" da entrega. O usuário digita a data
  // manualmente (campo com máscara DD/MM/AAAA), sem calendário.
  const agendamentoOverlay = document.getElementById('agendamentoOverlay');
  const agendamentoEntregaTitulo = document.getElementById('agendamentoEntregaTitulo');
  const agendamentoDisponivelEl = document.getElementById('agendamentoDisponivel');
  const agendamentoAnotacao = document.getElementById('agendamentoAnotacao');
  const agendamentoConfirmBtn = document.getElementById('agendamentoConfirmBtn');
  const agendamentoVoltarBtn = document.getElementById('agendamentoVoltarBtn');
  const agendamentoDataInput = document.getElementById('agendamentoDataInput');
  const agendamentoHint = document.getElementById('agendamentoHint');
  const agendamentoDataError = document.getElementById('agendamentoDataError');
  const agendamentoDataErrorText = document.getElementById('agendamentoDataErrorText');
  let agendamentoMinDate = null;
  let agendamentoMaxDate = null;
  let agendamentoSelectedDate = null;
  let agendamentoOnConfirm = null;

  function parseDataDisponivel(dataRetirada){
    // dataRetirada no formato "DD/MM" (ex.: "22/08")
    const m = /^(\d{2})\/(\d{2})$/.exec(dataRetirada || '');
    if(!m) return null;
    const anoRef = new Date().getFullYear();
    return new Date(anoRef, parseInt(m[2], 10) - 1, parseInt(m[1], 10));
  }
  function addBusinessDays(date, days){
    const result = new Date(date.getTime());
    let added = 0;
    while(added < days){
      result.setDate(result.getDate() + 1);
      const dow = result.getDay();
      if(dow !== 0 && dow !== 6) added++;
    }
    return result;
  }
  function toBRDate(date){
    return String(date.getDate()).padStart(2,'0') + '/' + String(date.getMonth()+1).padStart(2,'0') + '/' + date.getFullYear();
  }
  function parseBRDateString(str){
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(str || '');
    if(!m) return null;
    const d = parseInt(m[1], 10), mo = parseInt(m[2], 10), y = parseInt(m[3], 10);
    if(mo < 1 || mo > 12) return null;
    const date = new Date(y, mo - 1, d);
    if(date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null;
    return date;
  }

  // Máscara: formata os dígitos digitados como DD/MM/AAAA automaticamente.
  agendamentoDataInput.addEventListener('input', ()=>{
    const digits = agendamentoDataInput.value.replace(/\D/g, '').slice(0, 8);
    let formatted = digits;
    if(digits.length > 4) formatted = digits.slice(0,2) + '/' + digits.slice(2,4) + '/' + digits.slice(4);
    else if(digits.length > 2) formatted = digits.slice(0,2) + '/' + digits.slice(2);
    agendamentoDataInput.value = formatted;
    if(digits.length < 8){
      agendamentoConfirmBtn.disabled = true;
      clearAgendamentoError();
      return;
    }
    validateAgendamentoDate();
  });
  agendamentoDataInput.addEventListener('blur', validateAgendamentoDate);

  // Erro inline persistente (em vez de um toast que some sozinho e apagar o que o usuário digitou):
  // o valor digitado permanece no campo para ele corrigir, e quando a data só está fora do
  // intervalo permitido (não é um erro de formato) oferecemos um atalho de 1 clique para
  // preencher com a data limite mais próxima, evitando que ele precise calcular/redigitar.
  function showAgendamentoError(msg){
    agendamentoDataInput.classList.add('is-invalid');
    agendamentoDataErrorText.textContent = msg;
    agendamentoDataError.hidden = false;
  }
  function clearAgendamentoError(){
    agendamentoDataInput.classList.remove('is-invalid');
    agendamentoDataError.hidden = true;
  }

  function validateAgendamentoDate(){
    const value = agendamentoDataInput.value.trim();
    if(!value){
      agendamentoConfirmBtn.disabled = true;
      clearAgendamentoError();
      return;
    }
    const parsed = parseBRDateString(value);
    if(!parsed){
      agendamentoSelectedDate = null;
      agendamentoConfirmBtn.disabled = true;
      showAgendamentoError('Data inválida. Use o formato DD/MM/AAAA.');
      return;
    }
    if(agendamentoMinDate && parsed < agendamentoMinDate){
      agendamentoSelectedDate = null;
      agendamentoConfirmBtn.disabled = true;
      showAgendamentoError('Data inválida.');
      return;
    }
    if(agendamentoMaxDate && parsed > agendamentoMaxDate){
      agendamentoSelectedDate = null;
      agendamentoConfirmBtn.disabled = true;
      showAgendamentoError('Data inválida.');
      return;
    }
    clearAgendamentoError();
    agendamentoSelectedDate = parsed;
    agendamentoConfirmBtn.disabled = false;
  }

  function openAgendamentoModal(numero, dataRetirada, onConfirm){
    agendamentoEntregaTitulo.textContent = 'Entrega: ' + numero;
    const disponivelDate = parseDataDisponivel(dataRetirada);
    if(disponivelDate){
      agendamentoDisponivelEl.textContent = toBRDate(disponivelDate);
      agendamentoMinDate = disponivelDate;
      agendamentoMaxDate = addBusinessDays(disponivelDate, 5);
      agendamentoHint.textContent = 'Data permitida: ' + toBRDate(agendamentoMinDate) + ' até ' + toBRDate(agendamentoMaxDate);
    } else {
      agendamentoDisponivelEl.textContent = '—';
      agendamentoMinDate = null;
      agendamentoMaxDate = null;
      agendamentoHint.textContent = '';
    }
    agendamentoDataInput.value = '';
    agendamentoAnotacao.value = '';
    agendamentoSelectedDate = null;
    agendamentoOnConfirm = typeof onConfirm === 'function' ? onConfirm : null;
    agendamentoConfirmBtn.disabled = true;
    clearAgendamentoError();
    agendamentoOverlay.classList.add('open');
  }
  function closeAgendamentoModal(){
    agendamentoOverlay.classList.remove('open');
  }

  agendamentoVoltarBtn.addEventListener('click', closeAgendamentoModal);
  agendamentoOverlay.addEventListener('click', (e)=>{
    if(e.target === agendamentoOverlay) closeAgendamentoModal();
  });
  agendamentoConfirmBtn.addEventListener('click', ()=>{
    if(agendamentoConfirmBtn.disabled) return;
    const dataEscolhida = agendamentoSelectedDate;
    const onConfirm = agendamentoOnConfirm;
    closeAgendamentoModal();
    if(onConfirm && dataEscolhida) onConfirm(dataEscolhida);
    showToast('Agendamento tratado com sucesso (exploração de design — sem integração)');
  });

  // ---- Gravar: gera a entrega dos produtos selecionados ----
  // Os produtos tratados saem da "Lista de Produtos Sem entrega"; os demais permanecem até serem tratados.
  const entregaSuccessToast = document.getElementById('entregaSuccessToast');
  const produtoListaBody = document.getElementById('produtoListaBody');
  let entregaSuccessTimer;
  function showEntregaSuccessToast(){
    clearTimeout(entregaSuccessTimer);
    entregaSuccessToast.classList.add('show');
    entregaSuccessTimer = setTimeout(()=> entregaSuccessToast.classList.remove('show'), 3000);
  }
  const dadosEntregaCard = document.getElementById('dadosEntregaCard');
  function updateProdutoListaEmptyState(){
    const remaining = produtoListaBody.querySelectorAll('.produto-item').length;
    let emptyMsg = document.getElementById('produtoListaEmpty');
    if(remaining === 0){
      if(!emptyMsg){
        emptyMsg = document.createElement('div');
        emptyMsg.id = 'produtoListaEmpty';
        emptyMsg.style.cssText = 'padding:24px;color:var(--grey-500);font-size:14px;text-align:center;';
        emptyMsg.textContent = 'Não há produtos para esse pedido sem entregas.';
        produtoListaBody.appendChild(emptyMsg);
      }
    } else if(emptyMsg){
      emptyMsg.remove();
    }
    // Todos os itens já tiveram a entrega tratada: o card "Dados Para Entrega" não tem mais função aqui.
    dadosEntregaCard.style.display = remaining === 0 ? 'none' : '';
  }
  // ---- Lista de Entregas de Pedidos: um item novo a cada entrega gerada ----
  // Card de detalhe (aberto/fechado) conforme node 6506:121939.
  const entregasCard = document.getElementById('entregasCard');
  const entregasList = document.getElementById('entregasList');
  let entregaNumeroCounter = 72010410;
  function addEntregaResumoEntry(methodLabel, distribLabel, disponibilidadeText, produtos, produtoNodes){
    const numero = entregaNumeroCounter++;

    // "A partir de 22/08 - 9hrs" -> data "22/08", hora "9hrs"
    const m = /A partir de (.+?) - (.+)/.exec(disponibilidadeText || '');
    const dataRetirada = m ? m[1] : '';
    const horaRetirada = m ? m[2] : '';

    const produtosHtml = produtos.map(function(p){
      return (
        '<div class="entrega-produto-card">' +
          '<div class="entrega-produto-nome">' + p.nome + '</div>' +
          '<div class="entrega-produto-cor">' + p.cor + '</div>' +
          '<div class="entrega-produto-qtd"><span>Qtd:</span><span>' + p.qtd + '</span></div>' +
          (p.montagem ? '<button type="button" class="entrega-produto-montagem">Monte Você Mesmo</button>' : '') +
        '</div>'
      );
    }).join('');

    const row = document.createElement('div');
    row.className = 'entrega-resumo-row';
    row.innerHTML =
      '<button type="button" class="entrega-resumo-header">' +
        '<div class="entrega-resumo-top">' +
          '<div class="entrega-resumo-titulo">' +
            '<span class="badge-em-criacao">Em Criação</span>' +
            '<p class="entrega-resumo-nome">Entrega Nº. ' + numero + ' - ' + methodLabel + '</p>' +
          '</div>' +
          '<svg class="ic entrega-resumo-chevron"><use href="#i-chevron-down"></use></svg>' +
        '</div>' +
        '<div class="entrega-resumo-info"><p>' + distribLabel + '</p></div>' +
      '</button>' +
      '<div class="entrega-resumo-detail">' +
        '<div class="entrega-info-box">' +
          '<p>Prazo Extra de Entrega: <strong>1 dias</strong></p>' +
          '<p>Disponível para retirada a partir de <strong class="entrega-disponibilidade-valor">' + dataRetirada + '</strong> às <span class="entrega-disponibilidade-hora">' + horaRetirada + '</span>.</p>' +
          '<p><strong>Não será montado.</strong></p>' +
        '</div>' +
        '<div class="entrega-detail-actions">' +
          '<button type="button" class="btn-tratar-agendamento">Tratar Agendamento</button>' +
          '<button type="button" class="btn-excluir-entrega"><svg class="ic"><use href="#i-trash-2"></use></svg>Excluir Entrega</button>' +
        '</div>' +
        '<div class="entrega-produtos">' + produtosHtml + '</div>' +
      '</div>';

    row.querySelector('.entrega-resumo-header').addEventListener('click', ()=>{
      row.classList.toggle('open');
      row.querySelector('.entrega-resumo-chevron').classList.toggle('rotated');
    });
    row.querySelector('.btn-tratar-agendamento').addEventListener('click', ()=>{
      openAgendamentoModal(numero, dataRetirada, function(novaData){
        // Atualiza a data exibida em "Disponível para retirada a partir de..." desta entrega
        // com a nova data de retirada escolhida no agendamento.
        const valorEl = row.querySelector('.entrega-disponibilidade-valor');
        if(valorEl) valorEl.textContent = toBRDate(novaData);
      });
    });
    row.querySelector('.btn-excluir-entrega').addEventListener('click', ()=>{
      // Devolve o(s) produto(s) dessa entrega para a "Lista de Produtos Sem entrega", desmarcados,
      // para que a entrega seja tratada novamente.
      produtoNodes.forEach(function(node){
        const cb = node.querySelector('[data-product-checkbox]');
        if(cb) setCheckbox(cb, false);
        produtoListaBody.appendChild(node);
      });
      updateProdutoListaEmptyState();
      updateEntregaAvailability();
      updateGravarAvailability();

      row.remove();
      if(!entregasList.querySelector('.entrega-resumo-row')){
        entregasCard.style.display = 'none';
      }
      showToast('Entrega excluída — produto(s) voltaram para a lista sem entrega');
    });

    entregasList.appendChild(row);
    entregasCard.style.display = 'block';
  }

  btnGravar.addEventListener('click', ()=>{
    if(btnGravar.disabled) return;

    const itemsToRemove = Array.from(document.querySelectorAll('.produto-item')).filter(item=>{
      const cb = item.querySelector('[data-product-checkbox]');
      return cb && cb.classList.contains('checked');
    });

    // Captura os dados dos produtos antes de removê-los da "Lista de Produtos Sem entrega"
    const produtosGerados = itemsToRemove.map(function(item){
      const qtdSpans = item.querySelectorAll('.produto-qtd-inline span');
      return {
        nome: item.querySelector('.produto-nome').textContent,
        cor: item.querySelector('.produto-cor').textContent,
        qtd: qtdSpans.length > 1 ? qtdSpans[1].textContent : '1',
        montagem: !!item.querySelector('.badge-assemble')
      };
    });

    itemsToRemove.forEach(item=> item.remove());
    updateProdutoListaEmptyState();

    // Gera o item da "Lista de Entregas de Pedidos" com o método, o centro de distribuição e os produtos
    // (guarda os nós originais dos produtos para poder devolvê-los à lista se a entrega for excluída)
    addEntregaResumoEntry(
      entregaDetailConfig[currentEntregaSource].label,
      distribTitle.textContent,
      disponibilidadeValue.textContent,
      produtosGerados,
      itemsToRemove
    );

    // Reseta a seleção e o card "Dados Para Entrega" para o estado inicial
    setCheckbox(selectAllCheckbox, false);
    localRetiradaOptions.classList.remove('open');
    entregaDetailView.style.display = 'none';
    entregaOptionsView.style.display = 'flex';

    updateEntregaAvailability();
    updateGravarAvailability();
    showEntregaSuccessToast();
  });


  // ---- Opções de entrega: apenas visuais, sem ação ao clicar ----