/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
// @flow
import React, { Component } from 'react';
import Tree from '../../components/Tree';
import Panel from '../../components/Panel';
import onSelectNode from './onSelectNode';
import renderTreeNodes from './renderTreeNodes';
import fsSubjects from '../../store/fs/subjects';
import '../../components/Tree/assets/index.css';

type Props = {
  refreshScroll: boolean,
  treeData: Array<mixed> | undefined,
  activeNodePath: Array<mixed> | undefined,
  rootName: string | null
};

export default class FileExplorer extends Component<Props> {
    constructor(props: Props) {
        super(props: Props);
        // keeps path hash of nodes which children loading is in progress
        this.loadingNodes = {};
        // keeps reference to Rxjs subscriptions
        this.subscriptions = [];

        this.loadData = this.loadData.bind(this);
        this.onSubjectChildrenLoaded = this.onSubjectChildrenLoaded.bind(this);
        // subscribe to relevant subjects
        this.subscriptions['FILE.CHILDREN.LOADED'] = fsSubjects['FILE.CHILDREN.LOADED'].subscribe(this.onSubjectChildrenLoaded);
        // set initial selectedKeys value
        let selectedKeys = [];
        if (this.props.activeNodePath) {
            selectedKeys = [this.props.activeNodePath];
        }
        this.state = {
            selectedKeys
        };
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.activeNodePath !== nextProps.activeNodePath) {
            if (!nextProps.activeNodePath) {
                this.setState({
                    selectedKeys: [],
                });
            } else {
                this.setState({
                    selectedKeys: [nextProps.activeNodePath],
                });
            }
        }
    }

    componentWillUnmount() {
        if (this.subscriptions['FILE.CHILDREN.LOADED']) {
            this.subscriptions['FILE.CHILDREN.LOADED'].unsubscribe();
        }
    }

    loadData = (treeNode) => new Promise((resolve, reject) => {
        const nodeData = treeNode.props.nodeInfo;
        // add current node and promise functions to a loadingNodes list
        if (this.loadingNodes.hasOwnProperty(treeNode.path)) {
            reject("This node's children are currently being loaded.");
        }
        this.loadingNodes[nodeData.path] = {
            id: nodeData.path,
            node: nodeData,
            resolve: resolve,
            reject: reject,
        };
        this.props.treeLoadNodeChildren(nodeData);
    })

    onSubjectChildrenLoaded = (e) => {
        if (this.loadingNodes.hasOwnProperty(e.path)) {
            const loadingState = this.loadingNodes[e.path];
            delete this.loadingNodes[e.path];
            loadingState.resolve();
        }
    }

    onSelectNode = (selectedKeys, info) => {
        onSelectNode.apply(this, [selectedKeys, info]);
    }

    render() {
        const { rootName } = this.props;
        const { selectedKeys } = this.state;
        const headerTitle = 'File Explorer' + (rootName ? ` - ${rootName}` : '');
        return (
            <Panel
                header={headerTitle}
                scroller
                scrollWrapperClass="tree-wrapper"
                scrollRefresh={this.props.refreshScroll}
                scrollVerticalOnly
            >
              <Tree
                showLine
                checkable={false}
                defaultExpandedKeys={["nonexistingkey"]}
                autoExpandParent
                selectedKeys={selectedKeys}
                loadData={this.loadData}
                onSelect={this.onSelectNode}
              >
                {renderTreeNodes.apply(this, [this.props.treeData])}
              </Tree>
            </Panel>
        );
    }
}
/*

        <ScrollContainer
          refreshScroll={this.props.refreshScroll}
          disableHorizontal
          classes="tree-wrapper scroller"
        >
          {() => (
            <Tree
              showLine
              checkable={ false }
              defaultExpandedKeys={ ['nonexistingkey'] }
              autoExpandParent
              selectedKeys={ selectedKeys }
              loadData={ this.loadData }
              onSelect={ this.onSelectNode }
            >
              { renderTreeNodes.apply(this, [this.props.treeData]) }
            </Tree>
          )}
        </ScrollContainer>

              {renderTreeNodes(this.props.treeData, this.onSelectContexMenuItem)}
              onExpand={this.onExpandNode}
              selectedKeys={this.state.selectedKeys}
*/
