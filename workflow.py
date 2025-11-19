#!/usr/bin/env python3
import subprocess
import signal
import time

def iniciar_workflow():
    print("Iniciando workflow...")
    try:
        # Executa o comando "npm run workflow".
        # Caso queira executar outro comando, altere a lista de argumentos abaixo.
        workflow = subprocess.Popen(["npm", "run", "dev"])
        workflow.wait()  # Aguarda o término do workflow
        print(f"Workflow terminado com o código {workflow.returncode}")
        iniciar_loop_infinito()
    except Exception as e:
        print("Erro ao iniciar o workflow:", e)

def iniciar_loop_infinito():
    print("Entrando no loop infinito...")
    while True:
        print("Loop infinito ativo...")
        time.sleep(5)  # Espera 5 segundos entre as execuções

def sinal_interrupcao(signal_num, frame):
    print("Aplicativo encerrando...")
    iniciar_workflow()

if __name__ == '__main__':
    # Registra o manipulador do sinal SIGINT (CTRL+C)
    signal.signal(signal.SIGINT, sinal_interrupcao)
    print("Aplicativo rodando... Pressione CTRL+C para encerrar e iniciar o workflow.")

    # Mantém o aplicativo em execução, simulando um servidor ou tarefa contínua
    try:
        while True:
            time.sleep(1)
    except Exception as e:
        print("Erro no loop principal:", e)
