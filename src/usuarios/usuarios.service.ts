import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { hash } from 'bcrypt';

import { Usuario } from './usuario.entity';
import { CriarUsuarioDto } from './dtos/criar-usuario.dto';
import { CriarPrimeiroAdminDto } from './dtos/criar-primeiro-admin.dto';
import { UsuarioSemSenha } from './types/usuario-sem-senha.type';
import { CargoUsuario } from './enums/cargo-usuario.enum';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuariosRepository: Repository<Usuario>,
  ) {}

  // ===========
  // CRUD Básico
  // ===========

  // Busca um usuário específico pelo seu ID sem retornar o hash da senha
  async buscarPorId(id: string): Promise<UsuarioSemSenha> {
    const usuario = await this.usuariosRepository.findOne({
      where: {
        id,
      },
    });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return this.removerSenha(usuario);
  }

  // Cria um novo usuário no sistema e retorna seus dados sem o hash da senha
  async criar(usuarioNovo: CriarUsuarioDto): Promise<UsuarioSemSenha> {
    const nome = usuarioNovo.nome.trim();
    const email = usuarioNovo.email.trim().toLowerCase();

    const usuarioExistente = await this.buscarPorEmail(email);
    if (usuarioExistente) {
      throw new ConflictException(
        'Já existe um usuário cadastrado com este e-mail.',
      );
    }

    // Gera o hash da senha utilizando bcrypt
    const senhaHash: string = await hash(usuarioNovo.senha, 10);
    const novoUsuario = this.usuariosRepository.create({
      nome,
      email,
      senha: senhaHash,
      cargo: usuarioNovo.cargo,
    });

    const usuarioSalvo = await this.usuariosRepository.save(novoUsuario);
    return this.removerSenha(usuarioSalvo);
  }

  // =====================
  // Autenticação - Interno
  // =====================

  // Busca um usuário pelo seu e-mail
  async buscarPorEmail(email: string): Promise<Usuario | null> {
    const emailNormalizado = email.trim().toLowerCase();
    return this.usuariosRepository.findOne({
      where: {
        email: emailNormalizado,
      },
    });
  }

  // ===================
  // Funções Auxiliares
  // ===================

  // Retorna somente os dados do usuário que podem ser enviados para outras partes da aplicação
  private removerSenha(usuario: Usuario): UsuarioSemSenha {
    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      cargo: usuario.cargo,
    };
  }

  // Cria o primeiro administrador do sistema.
  async criarPrimeiroAdmin(
    usuarioNovo: CriarPrimeiroAdminDto,
  ): Promise<UsuarioSemSenha> {
    const existeUsuario = await this.existeAlgumUsuario();
    if (existeUsuario) {
      throw new ConflictException('O administrador inicial já foi criado.');
    }

    return this.criar({
      nome: usuarioNovo.nome,
      email: usuarioNovo.email,
      senha: usuarioNovo.senha,
      cargo: CargoUsuario.ADMIN,
    });
  }

  // Verifica se já existe pelo menos um usuário cadastrado no sistema.
  private async existeAlgumUsuario(): Promise<boolean> {
    const quantidadeUsuarios = await this.usuariosRepository.count();
    return quantidadeUsuarios > 0;
  }
}
